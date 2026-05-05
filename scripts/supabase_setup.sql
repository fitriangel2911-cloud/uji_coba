-- Enable the pgvector extension to work with embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing table and function to ensure dimensions are updated
-- WARNING: This will delete existing ingested documents. 
-- Remove these two lines if you want to keep data (but you must manually ALTER the column).
DROP FUNCTION IF EXISTS match_documents;
DROP TABLE IF EXISTS documents;

-- Create a table to store your documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT, -- corresponds to Document.pageContent
  metadata JSONB, -- corresponds to Document.metadata
  embedding VECTOR(3072) -- Dimensi disesuaikan dengan output embedding terbaru (3072)
);

-- Create a function to search for documents
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(3072),
  match_threshold FLOAT DEFAULT 0.0,
  match_count INT DEFAULT 10,
  filter JSONB DEFAULT '{}'
) RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
    AND (filter = '{}' OR documents.metadata @> filter)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Paksa Supabase API untuk me-refresh cache skema agar fungsi yang baru langsung dikenali
NOTIFY pgrst, 'reload schema';
