import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  logger.log('=== Application Starting ===');
  logger.log(`Node Environment: ${process.env.NODE_ENV || 'not set'}`);
  logger.log(`PORT from env: ${process.env.PORT || 'not set'}`);
  logger.log(`DB_URI from env: ${process.env.DB_URI ? '***SET***' : 'NOT SET'}`);
  logger.log(`MASTER_DB_URI from env: ${process.env.MASTER_DB_URI ? '***SET***' : 'NOT SET'}`);
  logger.log(`JWT_SECRET from env: ${process.env.JWT_SECRET ? '***SET***' : 'NOT SET'}`);
  
  // Log all relevant environment variables (masking sensitive ones)
  const envVars = ['NODE_ENV', 'PORT', 'DB_URI', 'MASTER_DB_URI', 'JWT_SECRET', 'EMAIL_HOST', 'EMAIL_USER', 'FRONTEND_URL'];
  logger.log('Environment Variables Summary:');
  envVars.forEach(key => {
    const value = process.env[key];
    if (value) {
      // Mask sensitive values
      if (key.includes('SECRET') || key.includes('PASSWORD') || key.includes('URI')) {
        logger.log(`  ${key}: ${value.substring(0, 20)}...${value.length > 20 ? '***' : ''}`);
      } else {
        logger.log(`  ${key}: ${value}`);
      }
    } else {
      logger.warn(`  ${key}: NOT SET`);
    }
  });

  logger.log('Creating NestJS application...');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Enable CORS
  logger.log('Enabling CORS...');
  app.enableCors();

  // Global validation pipe
  logger.log('Setting up global validation pipe...');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // Automatically convert string to number
      },
    }),
  );

  const port = process.env.PORT ?? 3000;
  logger.log(`Attempting to listen on port: ${port}`);
  await app.listen(port);
  logger.log(`✅ Application successfully started on port ${port}`);
  logger.log(`🌐 Server is running at http://0.0.0.0:${port}`);
}
bootstrap().catch((error) => {
  logger.error('❌ Failed to start application:', error);
  process.exit(1);
});
