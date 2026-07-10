import firebase_admin
from firebase_admin import credentials, db

# Load your service account key
cred = credentials.Certificate("serviceAccountKey.json")

firebase_admin.initialize_app(cred, {
    "databaseURL": "https://smart-parking-59ecb-default-rtdb.asia-southeast1.firebasedatabase.app/"
})

# Reference to parking data
ref_db = db.reference("parking")

def update_slot(slot, status):
    ref_db.update({
        slot: status
    })