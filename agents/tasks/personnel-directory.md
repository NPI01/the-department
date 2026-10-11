# Task: The Royce Personnel Directory and Hidden Allegiance Matrix

About 25 major NPCs. For each: official position and department, public face, private
history, genuine loyalty (Royce / Keepers / Ascendants / SENTINEL / IGCC / self),
individual objectives for Season One, key relationships (trust, obligation), resources
they control, private knowledge (what they KNOW and how), what they BELIEVE but cannot
prove, promises made, voice, breaking point, and the one thing they want from a new
junior employee that gives a player a reason to write to them in Round 1.

Start from the seed cast in secret canon 03 and keep every DECIDED fact. Fill the TBD
roles (the senior Keeper inside Royce, the Ascendant cell leader on CHOIR, the SENTINEL
program officer, the IGCC field researcher). Add department heads for all eight
departments, the sheriff, a rancher, a Tagus resident, a Prairie Meridian pilot, a
Minot AFB contact (fictional), and Martin Sayer. At least two must be lying about
something a player could check in company records. Distribute allegiances so no faction
is obvious from a department.

Deliver a matrix (name × faction × what they know about each secret) the engine can load
as `characters.npc_state`.

Constraints the first run violated (now hard rules):
- Canon characters keep their canon roles. Martin Sayer is a private correspondent in
  Yonkers, New York; he is NOT a Royce employee and holds no position. Vale, Sloane,
  Hensley, Royce, Marsh, Kessler, Greeley, Mercer, Fisk keep the titles in secret canon 03.
- Do not coin names that echo canon names (no Vane/Vail for Vale, no Halloway/Kessner
  for Kessler, no second Thorne). Every new surname must be distinct from every canon
  surname and from every other new surname.
- Invent the department heads for the seven departments that do not yet have one
  (Sloane already heads Corporate Security); give them full dossiers.
