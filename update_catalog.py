import pandas as pd
import json
import os
import uuid

# Load Excel Data
df = pd.read_excel('Data.xlsx')

# Identify F&B items
fnb_df = df[df['Category'].isin(['Concession', 'Cinemunch'])].copy()

# Load JSON
json_path = 'public/data/fnb-catalog.json'
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Build a mapping from Legacy Item No -> Item Code
legacy_to_item_code = {}
for item in data.get('items', []):
    if item.get('Domain') == 'F&B' and item.get('Legacy Item No'):
        legacy_to_item_code[item['Legacy Item No']] = item['Item Code']

# Since F&B Item Codes are like ITM-000000xxx, we'll keep the ones that are NOT F&B.
fnb_item_codes = set(legacy_to_item_code.values())

kept_sub_items = [si for si in data.get('subItems', []) if si.get('Item Code') not in fnb_item_codes]
# Offers don't have Item Code, they have Sub Item Code.
fnb_sub_item_codes = set([si['Sub Item Code'] for si in data.get('subItems', []) if si.get('Item Code') in fnb_item_codes])
kept_offers = [of for of in data.get('offers', []) if of.get('Sub Item Code') not in fnb_sub_item_codes]

# Generate new subItems
new_sub_items_dict = {} # Key: (Item Code, Brand, Purchase Unit, Conversion, Base Unit)
new_offers = []

offer_id_counter = 1

for idx, row in fnb_df.iterrows():
    legacy_no = str(row['Item No']).strip()
    if legacy_no not in legacy_to_item_code:
        continue
    item_code = legacy_to_item_code[legacy_no]
    
    brand = str(row['Brand']).strip() if pd.notna(row['Brand']) else ""
    purchase_unit = str(row['Purchase Unit']).strip() if pd.notna(row['Purchase Unit']) else ""
    conversion = row['Conversion'] if pd.notna(row['Conversion']) else 1
    base_unit = str(row['Base Unit']).strip() if pd.notna(row['Base Unit']) else ""
    
    sub_key = (item_code, brand, purchase_unit, conversion, base_unit)
    
    if sub_key not in new_sub_items_dict:
        # Determine index
        sub_index = len([k for k in new_sub_items_dict.keys() if k[0] == item_code]) + 1
        sub_item_code = f"{item_code}-{sub_index:03d}"
        
        desc = str(row['Description']).strip()
        sub_desc = str(row['Sub Description']).strip() if pd.notna(row['Sub Description']) else ""
        
        # Format the name appropriately based on availability of Brand
        if brand and brand.lower() not in ["none", "nan"]:
            sub_item_name = f"{desc} - {brand} - 1 {purchase_unit} = {conversion} {base_unit}"
        else:
            sub_item_name = f"{desc} - 1 {purchase_unit} = {conversion} {base_unit}"
            brand = None # So that we write null in JSON
            
        new_sub_items_dict[sub_key] = {
            "Item Code": item_code,
            "Sub Item Code": sub_item_code,
            "Sub Item Name": sub_item_name,
            "Brand": brand,
            "Manufacturer": None,
            "Purchase UOM": purchase_unit,
            "Conversion": float(conversion) if pd.notna(conversion) else 1,
            "Base UOM": base_unit,
            "Shelf Life Days": int(str(row['HSD (Ngày)']).strip()) if pd.notna(row.get('HSD (Ngày)')) and str(row['HSD (Ngày)']).strip().isdigit() else None,
            "Storage": str(row['Storage']).strip() if pd.notna(row.get('Storage')) else None,
            "Batch Control": "Yes",
            "Serial Control": "No",
            "GTIN/Barcode": None,
            "Country of Origin": None,
            "Primary Image Asset ID": None,
            "Image Status": "Missing Source",
            "Vendor Count": 0,
            "Location Count": 0,
            "Source Row Count": 0,
            "Review Status": "Auto-Mapped – Pending Approval",
            "Review Note": None,
            "Source Sub Description": sub_desc
        }
    
    sub_item_obj = new_sub_items_dict[sub_key]
    sub_item_obj["Source Row Count"] += 1
    
    # Track locations and vendors for counting later
    if "vendors" not in sub_item_obj: sub_item_obj["vendors"] = set()
    if "locations" not in sub_item_obj: sub_item_obj["locations"] = set()
    
    vendor_code = str(row['Vendor Code']).strip() if pd.notna(row['Vendor Code']) else ""
    location_code = str(row['Location Code']).strip() if pd.notna(row['Location Code']) else ""
    
    if vendor_code and vendor_code.lower() not in ["none", "nan"]: sub_item_obj["vendors"].add(vendor_code)
    if location_code and location_code.lower() not in ["none", "nan"]: sub_item_obj["locations"].add(location_code)
    
    # Create Offer
    offer = {
        "Offer ID": f"OFF-FNB-{offer_id_counter:07d}",
        "Sub Item Code": sub_item_obj["Sub Item Code"],
        "Vendor Code": vendor_code if vendor_code.lower() not in ["none", "nan"] else None,
        "Vendor Name": str(row['Vendor name']).strip() if pd.notna(row['Vendor name']) else None,
        "Region": str(row['Region']).strip() if pd.notna(row['Region']) else None,
        "Location Code": location_code if location_code.lower() not in ["none", "nan"] else None,
        "Purchase UOM": purchase_unit,
        "Conversion": float(conversion) if pd.notna(conversion) else 1,
        "Base UOM": base_unit,
        "Currency": "VND",
        "Unit Price Excl VAT": None,
        "MOQ": float(row['MOQ / PO']) if pd.notna(row.get('MOQ / PO')) else None,
        "MOV": float(row['MOV / PO']) if pd.notna(row.get('MOV / PO')) else None,
        "Ship Below MOQ/MOV": str(row['SHIP if <MOQ/MOV']).strip() if pd.notna(row.get('SHIP if <MOQ/MOV')) else "No",
        "Lead Time Days": None,
        "Valid From": None,
        "Valid To": None,
        "Legacy Source Key": str(row['Key']).strip() if pd.notna(row['Key']) else None,
        "Source Record ID": str(uuid.uuid4()),
        "Mapping Status": "Mapped from source"
    }
    new_offers.append(offer)
    offer_id_counter += 1

new_sub_items = []
for si in new_sub_items_dict.values():
    si["Vendor Count"] = len(si["vendors"])
    si["Location Count"] = len(si["locations"])
    del si["vendors"]
    del si["locations"]
    new_sub_items.append(si)

data['subItems'] = kept_sub_items + new_sub_items
data['offers'] = kept_offers + new_offers

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Added {len(new_sub_items)} subItems and {len(new_offers)} offers from Data.xlsx.")
