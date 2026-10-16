from pymongo import MongoClient
from bson import ObjectId
from src.config import MONGODB_URI, DB_NAME
import logging

logger = logging.getLogger("staypulse")

try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]
    
    # Collections
    hotels_col = db["hotels"]
    rooms_col = db["rooms"]
    reservations_col = db["reservations"]
    users_col = db["users"]
    chains_col = db["hotel_chains"]
    
    logger.info(f"Connected to MongoDB: {DB_NAME}")
except Exception as e:
    logger.error(f"Error connecting to MongoDB: {e}")
    raise e

def serialize_doc(doc):
    """Recursively convert ObjectId and non-serializable fields to string/JSON-friendly types."""
    if not doc:
        return doc
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        res = {}
        for k, v in doc.items():
            if k == "_id":
                res["id"] = str(v)
            elif isinstance(v, ObjectId):
                res[k] = str(v)
            elif isinstance(v, dict):
                res[k] = serialize_doc(v)
            elif isinstance(v, list):
                res[k] = [serialize_doc(i) for i in v]
            else:
                res[k] = v
        return res
    return doc

def serialize_docs(docs):
    return [serialize_doc(d) for d in docs]
