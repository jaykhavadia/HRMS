import { Module, Global, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '../../config/config.module';
import { ConfigService } from '../../config/config.service';
import { Connection } from 'mongoose';

const logger = new Logger('DatabaseModule');

@Global()
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const uri = configService.getMasterDbUri();
        const isAtlas = uri.includes('mongodb+srv://');

        logger.log('=== Database Connection Configuration ===');
        logger.log(`MongoDB URI: ${maskUri(uri)}`);
        logger.log(
          `Connection Type: ${isAtlas ? 'MongoDB Atlas (SRV)' : 'Standard MongoDB'}`,
        );

        if (isAtlas) {
          logger.log('⚠️  Using MongoDB Atlas - DNS SRV resolution required');
          logger.log(
            '⚠️  If connection fails, check: network connectivity, firewall, DNS resolution',
          );
        }

        logger.log(`Attempting to connect to MongoDB...`);

        // Increased timeouts for Atlas connections (DNS resolution can take time)
        const serverSelectionTimeout = isAtlas ? 30000 : 10000; // 30s for Atlas, 10s for local
        const connectTimeout = isAtlas ? 30000 : 10000;
        const socketTimeout = 45000;

        logger.log(`Server selection timeout: ${serverSelectionTimeout}ms`);
        logger.log(`Connection timeout: ${connectTimeout}ms`);
        logger.log(`Socket timeout: ${socketTimeout}ms`);

        return {
          uri,
          retryWrites: true,
          retryReads: true,
          serverSelectionTimeoutMS: serverSelectionTimeout,
          socketTimeoutMS: socketTimeout,
          connectTimeoutMS: connectTimeout,
          maxPoolSize: 10,
          minPoolSize: 1,
          connectionFactory: (connection: Connection) => {
            // Set up connection event listeners for debugging
            connection.on('connecting', () => {
              logger.log('🔄 Connecting to MongoDB...');
              if (isAtlas) {
                logger.log('   Resolving DNS SRV record...');
              }
            });

            connection.on('connected', () => {
              logger.log('✅ MongoDB connected successfully');
              logger.log(`   Database: ${connection.name}`);
              logger.log(`   Host: ${connection.host}`);
              logger.log(`   Port: ${connection.port}`);
              logger.log(
                `   Ready State: ${getReadyStateName(connection.readyState)}`,
              );
            });

            connection.on('error', (error: any) => {
              logger.error('❌ MongoDB connection error');
              logger.error(`   Error: ${error.message}`);
              logger.error(`   Error Name: ${error.name}`);
              logger.error(`   Error Code: ${error.code || 'N/A'}`);

              // Provide helpful error messages
              const errorMsg = error.message?.toLowerCase() || '';
              if (
                errorMsg.includes('whitelist') ||
                (errorMsg.includes('ip') && errorMsg.includes('atlas')) ||
                errorMsg.includes('could not connect to any servers')
              ) {
                logger.error('');
                logger.error('🚨 MONGODB ATLAS IP WHITELIST ISSUE DETECTED!');
                logger.error('');
                logger.error(
                  '   Your server IP address is NOT whitelisted in MongoDB Atlas.',
                );
                logger.error(
                  '   This is the MOST COMMON issue when deploying to cloud platforms.',
                );
                logger.error('');
                logger.error(
                  '   ✅ SOLUTION: Add your server IP to MongoDB Atlas whitelist',
                );
                logger.error('');
                logger.error('   Steps to fix:');
                logger.error(
                  '   1. Go to MongoDB Atlas Dashboard: https://cloud.mongodb.com/',
                );
                logger.error(
                  '   2. Select your cluster → "Network Access" (or "Security" → "Network Access")',
                );
                logger.error('   3. Click "Add IP Address"');
                logger.error(
                  '   4. For Render/Railway/Heroku/Cloud platforms, add: 0.0.0.0/0',
                );
                logger.error(
                  '      (This allows all IPs - OK for production with proper auth)',
                );
                logger.error(
                  '   5. OR add your specific server IP if you know it',
                );
                logger.error('   6. Wait 1-2 minutes for changes to propagate');
                logger.error('   7. Restart your application');
                logger.error('');
                logger.error(
                  '   ⚠️  Note: 0.0.0.0/0 allows all IPs. Make sure you have:',
                );
                logger.error('      - Strong database password');
                logger.error(
                  '      - Database user with minimal required permissions',
                );
                logger.error(
                  '      - Connection string is kept secret (environment variable)',
                );
                logger.error('');
              } else if (
                error.message?.includes('ETIMEOUT') ||
                error.message?.includes('querySrv')
              ) {
                logger.error('');
                logger.error('🔍 DNS Resolution Timeout Detected!');
                logger.error('   Possible causes:');
                logger.error('   1. Network connectivity issues');
                logger.error('   2. Firewall blocking DNS queries (port 53)');
                logger.error('   3. DNS server not responding');
                logger.error('   4. MongoDB Atlas cluster might be paused');
                logger.error('   5. VPN or proxy interfering with DNS');
                logger.error('');
                logger.error('   Troubleshooting steps:');
                logger.error('   - Check internet connectivity');

                // Extract cluster name from URI for troubleshooting
                const clusterMatch = uri.match(
                  /mongodb\+srv:\/\/[^@]+@([^/]+)/,
                );
                if (clusterMatch) {
                  const clusterHost = clusterMatch[1];
                  logger.error(
                    `   - Verify DNS resolution: nslookup _mongodb._tcp.${clusterHost}`,
                  );
                  logger.error(`   - Test connection: ping ${clusterHost}`);
                }

                logger.error(
                  '   - Check MongoDB Atlas dashboard - ensure cluster is running',
                );
                logger.error(
                  '   - Verify IP whitelist in MongoDB Atlas (0.0.0.0/0 for testing)',
                );
                logger.error(
                  '   - Try using standard connection string instead of mongodb+srv://',
                );
                logger.error(
                  '     (Get it from Atlas: Connect → Drivers → Standard connection string)',
                );
                logger.error('');
              } else if (error.message?.includes('ECONNREFUSED')) {
                logger.error('');
                logger.error('🔍 Connection Refused!');
                logger.error('   Possible causes:');
                logger.error('   1. MongoDB server is not running');
                logger.error('   2. Wrong host/port in connection string');
                logger.error('   3. Firewall blocking the connection');
                logger.error(
                  '   4. IP address not whitelisted (if using MongoDB Atlas)',
                );
                logger.error('');
              } else if (
                error.message?.includes('authentication') ||
                error.message?.includes('bad auth')
              ) {
                logger.error('');
                logger.error('🔍 Authentication Failed!');
                logger.error(
                  '   Check your username and password in the connection string',
                );
                logger.error('   Verify database user exists in MongoDB Atlas');
                logger.error('');
              } else if (error.name === 'MongooseServerSelectionError') {
                logger.error('');
                logger.error('🔍 Server Selection Error!');
                logger.error(
                  '   This usually means MongoDB Atlas cannot be reached.',
                );
                logger.error('   Common causes:');
                logger.error('   1. IP address not whitelisted (MOST COMMON)');
                logger.error('   2. Cluster is paused or deleted');
                logger.error('   3. Network connectivity issues');
                logger.error('   4. Firewall blocking connection');
                logger.error('');
                logger.error(
                  '   First, check IP whitelist in MongoDB Atlas Network Access settings',
                );
                logger.error('');
              }

              // Log full error stack in debug mode
              if (error.stack) {
                logger.debug(`   Stack trace: ${error.stack}`);
              }
            });

            connection.on('disconnected', () => {
              logger.warn('⚠️  MongoDB disconnected');
            });

            connection.on('reconnected', () => {
              logger.log('🔄 MongoDB reconnected');
            });

            connection.on('timeout', () => {
              logger.error('⏱️  MongoDB connection timeout');
              if (isAtlas) {
                logger.error(
                  '   DNS resolution or connection establishment timed out',
                );
              }
            });

            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}

function maskUri(uri: string): string {
  if (!uri) return 'empty';
  // Mask password in MongoDB URI
  return uri.replace(/:([^:@]+)@/, ':***@');
}

function getReadyStateName(state: number): string {
  const states: { [key: number]: string } = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
  };
  return states[state] || `unknown (${state})`;
}
