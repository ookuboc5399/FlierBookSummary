```sql
-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for books table
CREATE POLICY "Allow read access to all authenticated users"
ON books FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all access to admin users"
ON books FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for summaries table
CREATE POLICY "Allow read access to all authenticated users"
ON summaries FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all access to admin users"
ON summaries FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
```
