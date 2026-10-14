# Recorded parcel discovery responses

Source: City of Calgary Open Data, Open Government Licence – City of Calgary.

Contains information licensed under the Open Government Licence – City of Calgary.
https://data.calgary.ca/d/Open-Data-Terms/u45n-7awa

Recorded through authenticated staging zoneLookup.discoverParcels at commit b1f77cb.
One request per address; no project IDs or writes. JSON payload values are unchanged.
The no-data payload has no retrievedAt; its timestamp below is the recording time.

- coral-shores.json: 132 Coral Shores CA NE; retrieved 2026-10-14T04:09:18.868Z; {"rows":1,"accounts":1,"parcels":1}; truncated=false
- mcdougall.json: 701 McDougall Rd NE; retrieved 2026-10-14T04:09:19.466Z; {"rows":2,"accounts":2,"parcels":1}; truncated=false
- macleod.json: 800 Macleod Trail SE, Calgary; retrieved 2026-10-14T04:09:20.005Z; {"rows":18,"accounts":1,"parcels":18}; truncated=false
- auburn-bay.json: 10 Auburn Bay Li SE; retrieved 2026-10-14T04:09:21.081Z; {"rows":96,"accounts":96,"parcels":1}; truncated=false
- no-data.json: NOT A REAL ADDRESS; retrieved 2026-10-14T04:09:20.923Z; {"status":"no_data"}; truncated=null

outline-paths.golden.json contains the fixed expected SVG path strings derived once
from the recorded geometries using a 320 × 240 viewBox, 12 px padding, cosine
longitude correction at the bounding-box center latitude, uniform scale and
0.1 px rounding. Tests read this file without regenerating it, compare two runs
byte-for-byte, and separately assert hand-calculated polygon/hole paths.
