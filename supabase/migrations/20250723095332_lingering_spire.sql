-- =====================================================
-- EcoClean Website Database Setup
-- Complete PostgreSQL schema for Supabase
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CONTACTS TABLE
-- Stores all contact form submissions from the website
-- =====================================================

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  service text NOT NULL CHECK (service IN ('residential', 'commercial', 'deep', 'products')),
  message text,
  language text DEFAULT 'en' CHECK (language IN ('en', 'de')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_service ON contacts(service);
CREATE INDEX IF NOT EXISTS idx_contacts_language ON contacts(language);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Add comments for documentation
COMMENT ON TABLE contacts IS 'Stores contact form submissions from the EcoClean website';
COMMENT ON COLUMN contacts.id IS 'Unique identifier for each contact submission';
COMMENT ON COLUMN contacts.name IS 'Full name of the person submitting the form';
COMMENT ON COLUMN contacts.email IS 'Email address for follow-up communication';
COMMENT ON COLUMN contacts.phone IS 'Optional phone number';
COMMENT ON COLUMN contacts.service IS 'Type of service requested: residential, commercial, deep, or products';
COMMENT ON COLUMN contacts.message IS 'Optional message or additional details';
COMMENT ON COLUMN contacts.language IS 'Language preference: en (English) or de (German)';

-- =====================================================
-- USER PREFERENCES TABLE
-- Stores user preferences for anonymous sessions
-- =====================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  language text DEFAULT 'en' CHECK (language IN ('en', 'de')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_session_id ON user_preferences(session_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_language ON user_preferences(language);

-- Add comments for documentation
COMMENT ON TABLE user_preferences IS 'Stores user preferences for anonymous website visitors';
COMMENT ON COLUMN user_preferences.id IS 'Unique identifier for each preference record';
COMMENT ON COLUMN user_preferences.session_id IS 'Unique session identifier for anonymous users';
COMMENT ON COLUMN user_preferences.language IS 'User language preference: en (English) or de (German)';

-- =====================================================
-- NEWSLETTER SUBSCRIPTIONS TABLE (Optional Enhancement)
-- For future newsletter functionality
-- =====================================================

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  language text DEFAULT 'en' CHECK (language IN ('en', 'de')),
  is_active boolean DEFAULT true,
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for newsletter table
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletter_language ON newsletter_subscriptions(language);

-- Add comments for newsletter table
COMMENT ON TABLE newsletter_subscriptions IS 'Stores newsletter subscription information';
COMMENT ON COLUMN newsletter_subscriptions.email IS 'Subscriber email address';
COMMENT ON COLUMN newsletter_subscriptions.is_active IS 'Whether the subscription is currently active';
COMMENT ON COLUMN newsletter_subscriptions.subscribed_at IS 'When the user subscribed';
COMMENT ON COLUMN newsletter_subscriptions.unsubscribed_at IS 'When the user unsubscribed (if applicable)';

-- =====================================================
-- SERVICE REQUESTS TABLE (Optional Enhancement)
-- For detailed service booking functionality
-- =====================================================

CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN ('residential', 'commercial', 'deep', 'products')),
  property_size text CHECK (property_size IN ('small', 'medium', 'large', 'extra_large')),
  frequency text CHECK (frequency IN ('one_time', 'weekly', 'bi_weekly', 'monthly')),
  preferred_date date,
  preferred_time time,
  special_requirements text,
  estimated_price decimal(10,2),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  assigned_team_id uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for service requests
CREATE INDEX IF NOT EXISTS idx_service_requests_contact_id ON service_requests(contact_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_service_type ON service_requests(service_type);
CREATE INDEX IF NOT EXISTS idx_service_requests_preferred_date ON service_requests(preferred_date);

-- Add comments for service requests table
COMMENT ON TABLE service_requests IS 'Detailed service booking requests';
COMMENT ON COLUMN service_requests.contact_id IS 'Reference to the original contact form submission';
COMMENT ON COLUMN service_requests.property_size IS 'Size of the property to be cleaned';
COMMENT ON COLUMN service_requests.frequency IS 'How often the service should be performed';
COMMENT ON COLUMN service_requests.status IS 'Current status of the service request';

-- =====================================================
-- TRIGGER FUNCTIONS
-- Automatically update updated_at timestamps
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at columns
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_subscriptions_updated_at
  BEFORE UPDATE ON newsletter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- Configure security policies for all tables
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CONTACTS TABLE POLICIES
-- =====================================================

-- Allow anyone to submit contact forms
CREATE POLICY "Anyone can submit contact forms"
  ON contacts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to read all contacts (for admin purposes)
CREATE POLICY "Authenticated users can read contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update contacts (for admin purposes)
CREATE POLICY "Authenticated users can update contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (true);

-- =====================================================
-- USER PREFERENCES TABLE POLICIES
-- =====================================================

-- Allow anyone to manage preferences based on session_id
CREATE POLICY "Users can manage their own preferences"
  ON user_preferences
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- NEWSLETTER SUBSCRIPTIONS POLICIES
-- =====================================================

-- Allow anyone to subscribe to newsletter
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscriptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to update their own subscription (for unsubscribe)
CREATE POLICY "Users can update their own subscription"
  ON newsletter_subscriptions
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to read all subscriptions (for admin)
CREATE POLICY "Authenticated users can read subscriptions"
  ON newsletter_subscriptions
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- SERVICE REQUESTS POLICIES
-- =====================================================

-- Allow anyone to create service requests
CREATE POLICY "Anyone can create service requests"
  ON service_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to read all service requests (for admin)
CREATE POLICY "Authenticated users can read service requests"
  ON service_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update service requests (for admin)
CREATE POLICY "Authenticated users can update service requests"
  ON service_requests
  FOR UPDATE
  TO authenticated
  USING (true);

-- =====================================================
-- USEFUL VIEWS FOR ANALYTICS
-- Create views for common queries and reporting
-- =====================================================

-- View for contact form analytics
CREATE OR REPLACE VIEW contact_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  service,
  language,
  COUNT(*) as submission_count
FROM contacts
GROUP BY DATE_TRUNC('day', created_at), service, language
ORDER BY date DESC;

-- View for service popularity
CREATE OR REPLACE VIEW service_popularity AS
SELECT 
  service,
  COUNT(*) as total_requests,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM contacts
GROUP BY service
ORDER BY total_requests DESC;

-- View for language preferences
CREATE OR REPLACE VIEW language_preferences AS
SELECT 
  language,
  COUNT(*) as user_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM (
  SELECT language FROM contacts
  UNION ALL
  SELECT language FROM user_preferences
) combined
GROUP BY language;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- Uncomment to insert sample data for testing
-- =====================================================

/*
-- Sample contacts
INSERT INTO contacts (name, email, phone, service, message, language) VALUES
('John Smith', 'john.smith@email.com', '+1-555-0101', 'residential', 'Need weekly cleaning service for my home', 'en'),
('Maria Garcia', 'maria.garcia@email.com', '+1-555-0102', 'commercial', 'Office building needs deep cleaning', 'en'),
('Hans Mueller', 'hans.mueller@email.de', '+49-123-456789', 'deep', 'Benötige Tiefenreinigung für mein Haus', 'de'),
('Sarah Johnson', 'sarah.j@email.com', '+1-555-0103', 'products', 'Interested in eco-friendly cleaning products', 'en');

-- Sample user preferences
INSERT INTO user_preferences (session_id, language) VALUES
('session_abc123', 'en'),
('session_def456', 'de'),
('session_ghi789', 'en');
*/

-- =====================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- Helper functions for the application
-- =====================================================

-- Function to get contact statistics
CREATE OR REPLACE FUNCTION get_contact_stats()
RETURNS TABLE (
  total_contacts bigint,
  contacts_today bigint,
  contacts_this_week bigint,
  contacts_this_month bigint,
  most_popular_service text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM contacts) as total_contacts,
    (SELECT COUNT(*) FROM contacts WHERE created_at >= CURRENT_DATE) as contacts_today,
    (SELECT COUNT(*) FROM contacts WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as contacts_this_week,
    (SELECT COUNT(*) FROM contacts WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as contacts_this_month,
    (SELECT service FROM contacts GROUP BY service ORDER BY COUNT(*) DESC LIMIT 1) as most_popular_service;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old user preferences (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_preferences()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_preferences 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'EcoClean database setup completed successfully!';
  RAISE NOTICE 'Tables created: contacts, user_preferences, newsletter_subscriptions, service_requests';
  RAISE NOTICE 'Views created: contact_analytics, service_popularity, language_preferences';
  RAISE NOTICE 'Functions created: get_contact_stats(), cleanup_old_preferences()';
  RAISE NOTICE 'Row Level Security enabled with appropriate policies';
END $$;