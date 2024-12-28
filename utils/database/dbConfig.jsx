// this helps us to create functions to interact with db


import {neon} from '@neondatabase/serverless';
import {drizzle} from 'drizzle-orm/neon-http'; 
import * as schema from './schema';

// this instance to hold the connection to database
const sqlInstance = neon(process.env.DATABASE_URL);

// this instance is config with our sql connection & schema -> help us with db interaction
export const db = drizzle(sqlInstance, schema);
