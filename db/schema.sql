BEGIN;

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', (random() & 3) + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  status TEXT NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS ticket_votes (
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON UPDATE CASCADE ON DELETE CASCADE,
  username TEXT NOT NULL,
  PRIMARY KEY (ticket_id, username)
);

CREATE TABLE IF NOT EXISTS ticket_updates (
  id INTEGER PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON UPDATE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  changes TEXT NOT NULL CHECK (json_valid(changes))
);

CREATE TABLE IF NOT EXISTS ticket_relationships (
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON UPDATE CASCADE,
  related_ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON UPDATE CASCADE,
  PRIMARY KEY (ticket_id, related_ticket_id),
  CHECK (ticket_id < related_ticket_id)
);

CREATE VIEW IF NOT EXISTS related_tickets AS
  SELECT ticket_id, related_ticket_id FROM ticket_relationships
  UNION ALL
  SELECT related_ticket_id, ticket_id FROM ticket_relationships;

CREATE TRIGGER IF NOT EXISTS ticket_fields_updated
AFTER UPDATE ON tickets
WHEN OLD.id IS NOT NEW.id OR OLD.uuid IS NOT NEW.uuid OR OLD.title IS NOT NEW.title
  OR OLD.description IS NOT NEW.description OR OLD.created_at IS NOT NEW.created_at
  OR OLD.status IS NOT NEW.status
BEGIN
  INSERT INTO ticket_updates (ticket_id, changes)
  VALUES (NEW.id, json_patch(json_patch(json_patch(json_patch(json_patch(
    CASE WHEN OLD.id IS NOT NEW.id THEN json_object('id', json_object('old', OLD.id, 'new', NEW.id)) ELSE '{}' END,
    CASE WHEN OLD.uuid IS NOT NEW.uuid THEN json_object('uuid', json_object('old', OLD.uuid, 'new', NEW.uuid)) ELSE '{}' END),
    CASE WHEN OLD.title IS NOT NEW.title THEN json_object('title', json_object('old', OLD.title, 'new', NEW.title)) ELSE '{}' END),
    CASE WHEN OLD.description IS NOT NEW.description THEN json_object('description', json_object('old', OLD.description, 'new', NEW.description)) ELSE '{}' END),
    CASE WHEN OLD.created_at IS NOT NEW.created_at THEN json_object('created_at', json_object('old', OLD.created_at, 'new', NEW.created_at)) ELSE '{}' END),
    CASE WHEN OLD.status IS NOT NEW.status THEN json_object('status', json_object('old', OLD.status, 'new', NEW.status)) ELSE '{}' END));
END;

CREATE TRIGGER IF NOT EXISTS ticket_relationship_added
AFTER INSERT ON ticket_relationships
BEGIN
  INSERT INTO ticket_updates (ticket_id, changes) VALUES
    (NEW.ticket_id, json_object('related_tickets', json_object('old', NULL, 'new', NEW.related_ticket_id))),
    (NEW.related_ticket_id, json_object('related_tickets', json_object('old', NULL, 'new', NEW.ticket_id)));
END;

CREATE TRIGGER IF NOT EXISTS ticket_relationship_removed
AFTER DELETE ON ticket_relationships
BEGIN
  INSERT INTO ticket_updates (ticket_id, changes) VALUES
    (OLD.ticket_id, json_object('related_tickets', json_object('old', OLD.related_ticket_id, 'new', NULL))),
    (OLD.related_ticket_id, json_object('related_tickets', json_object('old', OLD.ticket_id, 'new', NULL)));
END;

CREATE TRIGGER IF NOT EXISTS ticket_relationship_updated
AFTER UPDATE ON ticket_relationships
WHEN OLD.ticket_id IS NOT NEW.ticket_id OR OLD.related_ticket_id IS NOT NEW.related_ticket_id
BEGIN
  INSERT INTO ticket_updates (ticket_id, changes) VALUES
    (OLD.ticket_id, json_object('related_tickets', json_object('old', OLD.related_ticket_id, 'new', NULL))),
    (OLD.related_ticket_id, json_object('related_tickets', json_object('old', OLD.ticket_id, 'new', NULL))),
    (NEW.ticket_id, json_object('related_tickets', json_object('old', NULL, 'new', NEW.related_ticket_id))),
    (NEW.related_ticket_id, json_object('related_tickets', json_object('old', NULL, 'new', NEW.ticket_id)));
END;

COMMIT;
