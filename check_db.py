import re
import urllib.request
import json

def get_keys(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    url_match = re.search(r'(?:SUPABASE_URL|supabaseUrl)\s*[:=]\s*[\'\"]([^\'\"]+)[\'\"]', html)
    key_match = re.search(r'(?:SUPABASE_ANON_KEY|supabaseKey)\s*[:=]\s*[\'\"]([^\'\"]+)[\'\"]', html)
    
    return url_match.group(1), key_match.group(1)

def check_tables(url, key):
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    
    tables = []
    # Try fetching a row from mdm_item
    try:
        req = urllib.request.Request(f"{url}/rest/v1/mdm_item?limit=1", headers=headers)
        with urllib.request.urlopen(req) as response:
            tables.append('mdm_item')
    except:
        pass
        
    try:
        req = urllib.request.Request(f"{url}/rest/v1/raw_data?limit=1", headers=headers)
        with urllib.request.urlopen(req) as response:
            tables.append('raw_data')
    except:
        pass
        
    return tables

scm_url, scm_key = get_keys('D:\\files (1)\\files (1)\\index.html')
sup_url, sup_key = get_keys('public/env.js')

print("SCM DB tables:", check_tables(scm_url, scm_key))
print("Supplier DB tables:", check_tables(sup_url, sup_key))
