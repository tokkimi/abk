CREATE TABLE IF NOT EXISTS abk_users (
 id uuid PRIMARY KEY, email text UNIQUE NOT NULL, name text NOT NULL,
 role text NOT NULL CHECK(role IN ('admin','client','contractor')),
 password_hash text, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS abk_clients (
 id uuid PRIMARY KEY, name text NOT NULL, email text NOT NULL, phone text NOT NULL DEFAULT '',
 address text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS abk_projects (
 id uuid PRIMARY KEY, client_id uuid NOT NULL REFERENCES abk_clients(id), title text NOT NULL,
 category text NOT NULL, status text NOT NULL DEFAULT 'planning' CHECK(status IN ('planning','active','paused','complete','archived')),
 description text NOT NULL DEFAULT '', start_date date, due_date date, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS abk_members (
 project_id uuid REFERENCES abk_projects(id) ON DELETE CASCADE,
 user_id uuid REFERENCES abk_users(id), can_update_tasks boolean NOT NULL DEFAULT false,
 PRIMARY KEY(project_id,user_id)
);
CREATE TABLE IF NOT EXISTS abk_tasks (
 id uuid PRIMARY KEY, project_id uuid NOT NULL REFERENCES abk_projects(id), title text NOT NULL,
 description text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','doing','done')),
 assignee_id uuid REFERENCES abk_users(id), due_date date, completed_at timestamptz,
 visibility text NOT NULL CHECK(visibility IN ('internal','client','shared')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS abk_requests (
 id uuid PRIMARY KEY, name text NOT NULL, email text NOT NULL, phone text NOT NULL DEFAULT '',
 category text NOT NULL, content text NOT NULL, source text NOT NULL DEFAULT 'site',
 status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','qualified','converted','closed')),
 client_id uuid REFERENCES abk_clients(id), project_id uuid REFERENCES abk_projects(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS abk_messages (
 id uuid PRIMARY KEY, project_id uuid REFERENCES abk_projects(id), request_id uuid REFERENCES abk_requests(id),
 author_id uuid NOT NULL REFERENCES abk_users(id), body text NOT NULL,
 visibility text NOT NULL CHECK(visibility IN ('internal','client','shared')),
 created_at timestamptz NOT NULL DEFAULT now(), CHECK((project_id IS NULL) <> (request_id IS NULL))
);
CREATE TABLE IF NOT EXISTS abk_documents (
 id uuid PRIMARY KEY, project_id uuid NOT NULL REFERENCES abk_projects(id), author_id uuid REFERENCES abk_users(id),
 name text NOT NULL, mime text NOT NULL, bytes bytea NOT NULL, size integer NOT NULL CHECK(size>0 AND size<=3000000),
 visibility text NOT NULL CHECK(visibility IN ('internal','client','shared')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS abk_ledger (
 id uuid PRIMARY KEY, project_id uuid REFERENCES abk_projects(id), kind text NOT NULL CHECK(kind IN ('income','expense')),
 state text NOT NULL CHECK(state IN ('planned','invoiced','paid')), label text NOT NULL,
 category text NOT NULL, date date NOT NULL, net_cents bigint NOT NULL CHECK(net_cents>=0),
 vat_cents bigint NOT NULL CHECK(vat_cents>=0), note text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS abk_sessions (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES abk_users(id), csrf text NOT NULL,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS abk_invitations (
 id uuid PRIMARY KEY, email text NOT NULL, name text NOT NULL, role text NOT NULL CHECK(role IN ('client','contractor','reset')),
 project_id uuid REFERENCES abk_projects(id), token_hash text UNIQUE NOT NULL, can_update_tasks boolean NOT NULL DEFAULT false,
 expires_at timestamptz NOT NULL, used_at timestamptz, revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS abk_audit (
 id uuid PRIMARY KEY, actor_id uuid REFERENCES abk_users(id), action text NOT NULL, entity_id text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS abk_rate_limits (
 key text PRIMARY KEY, count integer NOT NULL, window_start timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS abk_tasks_project ON abk_tasks(project_id);
CREATE INDEX IF NOT EXISTS abk_messages_project ON abk_messages(project_id,created_at);
CREATE INDEX IF NOT EXISTS abk_members_user ON abk_members(user_id);
CREATE INDEX IF NOT EXISTS abk_requests_created ON abk_requests(created_at);
CREATE INDEX IF NOT EXISTS abk_ledger_date ON abk_ledger(date);
ALTER TABLE abk_users ADD COLUMN IF NOT EXISTS company text NOT NULL DEFAULT '';
ALTER TABLE abk_users ADD COLUMN IF NOT EXISTS trade text NOT NULL DEFAULT '';
ALTER TABLE abk_users ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';
ALTER TABLE abk_users ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';
ALTER TABLE abk_projects ADD COLUMN IF NOT EXISTS site_details jsonb NOT NULL DEFAULT '{}';
ALTER TABLE abk_projects ADD COLUMN IF NOT EXISTS internal_notes text NOT NULL DEFAULT '';
ALTER TABLE abk_projects ADD COLUMN IF NOT EXISTS budget_cents bigint CHECK(budget_cents>=0);
CREATE TABLE IF NOT EXISTS abk_events (
 id uuid PRIMARY KEY, contractor_id uuid NOT NULL REFERENCES abk_users(id),
 project_id uuid REFERENCES abk_projects(id), title text NOT NULL,
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
 description text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(ends_at>starts_at)
);
CREATE INDEX IF NOT EXISTS abk_events_contractor ON abk_events(contractor_id,starts_at);
CREATE TABLE IF NOT EXISTS abk_message_documents (
 message_id uuid NOT NULL REFERENCES abk_messages(id) ON DELETE CASCADE,
 document_id uuid NOT NULL REFERENCES abk_documents(id) ON DELETE CASCADE,
 PRIMARY KEY(message_id,document_id)
);
CREATE TABLE IF NOT EXISTS abk_reads (
 user_id uuid NOT NULL REFERENCES abk_users(id), project_id uuid NOT NULL REFERENCES abk_projects(id),
 read_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,project_id)
);
ALTER TABLE abk_events ENABLE ROW LEVEL SECURITY;
-- All data is accessed through the Vercel server, never the browser REST API.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['abk_users','abk_clients','abk_projects','abk_members','abk_tasks','abk_requests','abk_messages','abk_documents','abk_ledger','abk_sessions','abk_invitations','abk_audit','abk_rate_limits','abk_events','abk_reads','abk_message_documents'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN EXECUTE format('REVOKE ALL ON TABLE %I FROM anon',t); END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN EXECUTE format('REVOKE ALL ON TABLE %I FROM authenticated',t); END IF;
 END LOOP;
END $$;
