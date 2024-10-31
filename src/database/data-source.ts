import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const isSyncEnable = !isProduction && process.env.TYPEORM_FORCE === 'true';
const isLoggingEnable = process.env.TYPEORM_LOGGING === 'true';

export const dataSourceOptions: DataSourceOptions = {
  logging: isLoggingEnable,
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: isSyncEnable,
  migrations: ['dist/**/migrations/*{.ts,.js}'],
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrationsTableName: 'typeorm-migrations',
};

export default new DataSource(dataSourceOptions);
