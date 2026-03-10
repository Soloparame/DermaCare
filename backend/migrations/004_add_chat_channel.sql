-- Migration to add channel column to chat_messages table
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'care_team';
