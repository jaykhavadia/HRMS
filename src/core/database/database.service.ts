import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, createConnection } from 'mongoose';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private tenantConnections: Map<string, Connection> = new Map();

  constructor(
    @InjectConnection() private masterConnection: Connection,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    // Master connection is already established via MongooseModule
    this.logger.log('=== DatabaseService Initialized ===');
    this.logger.log(
      `Master connection state: ${this.masterConnection.readyState}`,
    );
    this.logger.log(`Master connection name: ${this.masterConnection.name}`);
    this.logger.log(`Master connection host: ${this.masterConnection.host}`);
    this.logger.log(`Master connection port: ${this.masterConnection.port}`);

    // Set up connection event listeners for debugging
    this.masterConnection.on('connected', () => {
      this.logger.log('✅ Master database connected successfully');
    });

    this.masterConnection.on('error', (error) => {
      this.logger.error('❌ Master database connection error:', error.message);
    });

    this.masterConnection.on('disconnected', () => {
      this.logger.warn('⚠️  Master database disconnected');
    });

    this.masterConnection.on('reconnected', () => {
      this.logger.log('🔄 Master database reconnected');
    });
  }

  /**
   * Get tenant database name
   */
  getTenantDbName(clientId: string, clientName: string): string {
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
    return `${clientId}_${sanitizedClientName}`.toLowerCase();
  }

  /**
   * Get tenant connection URI
   */
  getTenantConnectionUri(baseUri: string, dbName: string): string {
    // For MongoDB Atlas, append database name to connection string
    if (baseUri.includes('mongodb.net')) {
      return baseUri.replace(/\/[^\/]*$/, `/${dbName}`);
    }
    // For local MongoDB: remove existing database name and append tenant database name
    // Example: mongodb://localhost:27017/hrms-master -> mongodb://localhost:27017/{dbName}
    const uriWithoutDb = baseUri.replace(/\/[^\/]*$/, '');
    return `${uriWithoutDb}/${dbName}`;
  }

  /**
   * Get or create tenant database connection
   */
  async getTenantConnection(
    clientId: string,
    clientName: string,
  ): Promise<Connection> {
    const dbName = this.getTenantDbName(clientId, clientName);
    const connectionKey = `${clientId}_${dbName}`;

    this.logger.debug(`Getting tenant connection for: ${connectionKey}`);

    if (this.tenantConnections.has(connectionKey)) {
      const existingConnection = this.tenantConnections.get(connectionKey);
      if (existingConnection) {
        this.logger.debug(`Using existing tenant connection: ${connectionKey}`);
        return existingConnection;
      }
    }

    // Use master DB URI for tenant databases (local MongoDB)
    const baseUri = this.configService.getMasterDbUri();
    const connectionUri = this.getTenantConnectionUri(baseUri, dbName);

    this.logger.log(`Creating new tenant connection: ${connectionKey}`);
    this.logger.debug(`Tenant connection URI: ${this.maskUri(connectionUri)}`);

    try {
      const connection = await createConnection(connectionUri).asPromise();
      this.tenantConnections.set(connectionKey, connection);
      this.logger.log(
        `✅ Tenant connection created successfully: ${connectionKey}`,
      );
      return connection;
    } catch (error) {
      this.logger.error(
        `❌ Failed to create tenant connection: ${connectionKey}`,
        error.message,
      );
      throw error;
    }
  }

  private maskUri(uri: string): string {
    if (!uri) return 'empty';
    // Mask password in MongoDB URI
    return uri.replace(/:([^:@]+)@/, ':***@');
  }

  /**
   * Get tenant model for a specific database
   */
  async getTenantModel<T>(
    clientId: string,
    clientName: string,
    modelName: string,
    schema: any,
  ): Promise<any> {
    const connection = await this.getTenantConnection(clientId, clientName);

    // Return existing model if already registered
    if (connection.models[modelName]) {
      return connection.models[modelName];
    }

    // Create and return new model
    return connection.model(modelName, schema);
  }

  /**
   * Create tenant database and initialize collections
   */
  async createTenantDatabase(
    clientId: string,
    clientName: string,
  ): Promise<void> {
    const connection = await this.getTenantConnection(clientId, clientName);
    const db = connection.db;

    if (!db) {
      throw new Error('Database connection failed');
    }

    // Database is created automatically on first use
    // Initialize default collections/indexes if needed
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('attendance').createIndex({ userId: 1, date: 1 });
    await db.collection('attendance').createIndex({ checkInTime: 1 });
  }
}
