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
INSERT INTO tickets(id,uuid,title,description,created_at,status) VALUES(10,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a10','Prescription renewal requests','Allow patients to request a prescription renewal and notify their care team for review.','2026-10-28T10:00:00.000Z','in_review');
INSERT INTO tickets(id,uuid,title,description,created_at,status) VALUES(11,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a11','Waitlist for earlier appointments','Let patients join a waitlist and accept a newly available appointment slot.','2026-10-28T10:00:00.000Z','open');
INSERT INTO tickets(id,uuid,title,description,created_at,status) VALUES(12,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a12','Upload referral documents','Allow patients to upload a referral before their first specialist appointment.','2026-10-28T10:00:00.000Z','in_progress');
INSERT INTO tickets(id,uuid,title,description,created_at,status) VALUES(13,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a13','Record patient accessibility needs','Let clinic staff record accessibility needs so the team can prepare for the visit.','2026-10-28T10:00:00.000Z','open');
INSERT INTO tickets(id,uuid,title,description,created_at,status) VALUES(14,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a14','Insurance eligibility check','Show clinic staff whether a patient''s insurance is eligible before an appointment.','2026-10-28T10:00:00.000Z','testing');
INSERT INTO tickets(id,uuid,title,description,created_at,status) VALUES(15,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a15','Send intake forms before visits','Send patients a link to complete intake forms before their scheduled appointment.','2026-10-28T10:00:00.000Z','in_progress');
INSERT INTO tickets(id,uuid,title,description,created_at,status) VALUES(16,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a16','Track unanswered patient messages','Show care teams patient messages that have not received a response.','2026-10-28T10:00:00.000Z','open');
INSERT INTO tickets(id,uuid,title,description,created_at,status) VALUES(17,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a17','Cancel appointments online','Allow patients to cancel a booking and release the slot for another patient.','2026-10-28T10:00:00.000Z','open');
INSERT INTO tickets(id,uuid,title,description,created_at,status) VALUES(18,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a18','Share lab result availability','Notify patients when new lab results are ready to view in the patient portal.','2026-10-28T10:00:00.000Z','in_review');
INSERT INTO tickets(id,uuid,title,description,created_at,status) VALUES(19,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a19','View care team messages in one place','Give patients a single inbox for messages from their clinic and care team.','2026-10-28T10:00:00.000Z','open');
INSERT INTO tickets(id,uuid,title,description,created_at,status) VALUES(20,'73bdc4ce-eabb-4ad3-8bba-c6f9a3250a20','See all appointments in one calendar','Show a patient''s upcoming appointments across clinics in one calendar.','2026-10-28T10:00:00.000Z','open');
INSERT INTO ticket_votes(ticket_id,username) VALUES(1,'bruno_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(3,'diego_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(4,'elisa_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(4,'fernanda_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(5,'fernanda_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(6,'gabriel_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(7,'helena_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(7,'igor_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(10,'kai_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(10,'lara_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(10,'marcos_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(10,'nina_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(10,'otavio_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(10,'paula_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(11,'lara_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(11,'marcos_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(11,'nina_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(11,'otavio_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(12,'marcos_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(12,'nina_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(12,'otavio_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(12,'paula_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(12,'rafa_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(13,'nina_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(13,'otavio_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(13,'paula_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(14,'ana_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(14,'otavio_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(14,'paula_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(14,'rafa_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(15,'ana_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(15,'bruno_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(15,'carla_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(15,'diego_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(15,'paula_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(15,'rafa_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(16,'ana_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(16,'rafa_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(17,'ana_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(17,'bruno_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(17,'carla_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(17,'diego_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(17,'elisa_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(18,'bruno_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(18,'carla_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(18,'diego_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(18,'elisa_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(19,'carla_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(19,'diego_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(19,'elisa_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(19,'fernanda_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(19,'gabriel_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(19,'helena_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(19,'igor_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(19,'julia_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(19,'kai_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(19,'lara_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(19,'marcos_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(19,'nina_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(19,'otavio_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'ana_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'bruno_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'carla_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'diego_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'elisa_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'fernanda_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'gabriel_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'helena_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'igor_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'julia_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'kai_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'lara_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'marcos_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'nina_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'otavio_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'paula_demo');
INSERT INTO ticket_votes(ticket_id,username) VALUES(20,'rafa_demo');
COMMIT;
