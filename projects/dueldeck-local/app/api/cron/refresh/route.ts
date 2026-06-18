// src/app/api/cron/refresh/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// ... (other imports)

const API_KEY_ENV = process.env.YGO_API_KEY;
const API_SECRET_ENV = process.env.CRON_SECRET;

const DDL = {
  users: {
    id: 'BIGSERIAL PRIMARY KEY',
    email: 'VARCHAR(255) UNIQUE NOT NULL',
    password_hash: 'TEXT NOT NULL',
    name: 'VARCHAR(255) DEFAULT 