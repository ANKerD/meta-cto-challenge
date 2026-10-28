PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', (random() & 3) + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  status TEXT NOT NULL DEFAULT 'open'
);
INSERT INTO tickets VALUES(1,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a01','Book appointments online','As a patient, I want to see available appointment times and book without calling the clinic.','2026-10-20T10:00:00.000Z','open');
INSERT INTO tickets VALUES(2,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a02','Send appointment reminders','Send patients a reminder before their appointment so they can confirm or reschedule.','2026-10-21T10:00:00.000Z','in_progress');
INSERT INTO tickets VALUES(3,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a03','Share visit summaries','Let clinicians share a visit summary with a patient through the patient portal after an appointment.','2026-10-22T10:00:00.000Z','in_review');
INSERT INTO tickets VALUES(4,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a04','Reschedule an appointment','Allow patients to choose another available slot when they cannot attend their appointment.','2026-10-23T10:00:00.000Z','open');
INSERT INTO tickets VALUES(5,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a05','Export appointment schedules','Allow clinic staff to export the daily appointment schedule for operational reporting.','2026-10-24T10:00:00.000Z','closed');
INSERT INTO tickets VALUES(6,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a06','Join a video consultation','Let patients join a scheduled video consultation from the appointment details page.','2026-10-25T10:00:00.000Z','testing');
INSERT INTO tickets VALUES(7,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a07','Download appointment receipts','Allow patients to download receipts for completed appointments from the patient portal.','2026-10-26T10:00:00.000Z','done');
INSERT INTO tickets VALUES(8,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a08','Change my booking time','Let patients move an existing booking to another time without contacting the clinic.','2026-10-27T10:00:00.000Z','duplicate');
INSERT INTO tickets VALUES(9,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a09','Add interpreter preferences','Let patients indicate that they need an interpreter when requesting an appointment.','2026-10-28T10:00:00.000Z','open');
CREATE TABLE ticket_votes (
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON UPDATE CASCADE ON DELETE CASCADE,
  username TEXT NOT NULL,
  PRIMARY KEY (ticket_id, username)
);
INSERT INTO ticket_votes VALUES(2,'ana_demo');
INSERT INTO ticket_votes VALUES(2,'bruno_demo');
INSERT INTO ticket_votes VALUES(3,'bruno_demo');
INSERT INTO ticket_votes VALUES(3,'carla_demo');
INSERT INTO ticket_votes VALUES(4,'carla_demo');
INSERT INTO ticket_votes VALUES(4,'diego_demo');
INSERT INTO ticket_votes VALUES(5,'diego_demo');
INSERT INTO ticket_votes VALUES(5,'elisa_demo');
INSERT INTO ticket_votes VALUES(6,'ana_demo');
INSERT INTO ticket_votes VALUES(6,'bruno_demo');
INSERT INTO ticket_votes VALUES(6,'carla_demo');
INSERT INTO ticket_votes VALUES(7,'bruno_demo');
INSERT INTO ticket_votes VALUES(7,'carla_demo');
INSERT INTO ticket_votes VALUES(7,'diego_demo');
INSERT INTO ticket_votes VALUES(8,'carla_demo');
INSERT INTO ticket_votes VALUES(8,'diego_demo');
INSERT INTO ticket_votes VALUES(8,'elisa_demo');
INSERT INTO ticket_votes VALUES(9,'ana_demo');
INSERT INTO ticket_votes VALUES(9,'bruno_demo');
INSERT INTO ticket_votes VALUES(9,'carla_demo');
INSERT INTO ticket_votes VALUES(9,'diego_demo');
INSERT INTO ticket_votes VALUES(9,'elisa_demo');
CREATE TABLE ticket_updates (
  id INTEGER PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON UPDATE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  changes TEXT NOT NULL CHECK (json_valid(changes))
);
INSERT INTO ticket_updates VALUES(1,1,'2026-10-28T03:15:55.105Z','{"related_tickets":{"old":null,"new":4}}');
INSERT INTO ticket_updates VALUES(2,4,'2026-10-28T03:15:55.105Z','{"related_tickets":{"old":null,"new":1}}');
INSERT INTO ticket_updates VALUES(3,4,'2026-10-28T03:15:55.105Z','{"related_tickets":{"old":null,"new":8}}');
INSERT INTO ticket_updates VALUES(4,8,'2026-10-28T03:15:55.105Z','{"related_tickets":{"old":null,"new":4}}');
CREATE TABLE ticket_relationships (
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON UPDATE CASCADE,
  related_ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON UPDATE CASCADE,
  PRIMARY KEY (ticket_id, related_ticket_id),
  CHECK (ticket_id < related_ticket_id)
);
INSERT INTO ticket_relationships VALUES(1,4);
INSERT INTO ticket_relationships VALUES(4,8);
INSERT INTO sqlite_sequence VALUES('tickets',9);
CREATE VIEW related_tickets AS
  SELECT ticket_id, related_ticket_id FROM ticket_relationships
  UNION ALL
  SELECT related_ticket_id, ticket_id FROM ticket_relationships;
CREATE TRIGGER ticket_fields_updated
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
CREATE TRIGGER ticket_relationship_added
AFTER INSERT ON ticket_relationships
BEGIN
  INSERT INTO ticket_updates (ticket_id, changes) VALUES
    (NEW.ticket_id, json_object('related_tickets', json_object('old', NULL, 'new', NEW.related_ticket_id))),
    (NEW.related_ticket_id, json_object('related_tickets', json_object('old', NULL, 'new', NEW.ticket_id)));
END;
CREATE TRIGGER ticket_relationship_removed
AFTER DELETE ON ticket_relationships
BEGIN
  INSERT INTO ticket_updates (ticket_id, changes) VALUES
    (OLD.ticket_id, json_object('related_tickets', json_object('old', OLD.related_ticket_id, 'new', NULL))),
    (OLD.related_ticket_id, json_object('related_tickets', json_object('old', OLD.ticket_id, 'new', NULL)));
END;
CREATE TRIGGER ticket_relationship_updated
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
