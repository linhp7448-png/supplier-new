import re

def get_keys(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    url_match = re.search(r'(?:SUPABASE_URL|supabaseUrl)\s*[:=]\s*[\'\"]([^\'\"]+)[\'\"]', html)
    key_match = re.search(r'(?:SUPABASE_ANON_KEY|supabaseKey)\s*[:=]\s*[\'\"]([^\'\"]+)[\'\"]', html)
    
    url = url_match.group(1) if url_match else "NOT FOUND"
    key = key_match.group(1) if key_match else "NOT FOUND"
    return url, key

try:
    scm_url, scm_key = get_keys('D:\\files (1)\\files (1)\\index.html')
    print("SCM Project:")
    print("URL:", scm_url)
    print("KEY:", scm_key[:10] + "...")
except Exception as e:
    print("SCM error:", e)

try:
    sup_url, sup_key = get_keys('public/env.js')
    print("\nSupplier Project:")
    print("URL:", sup_url)
    print("KEY:", sup_key[:10] + "...")
except Exception as e:
    print("Supplier env.js error:", e)
    
try:
    sup_url, sup_key = get_keys('public/index.html')
    print("\nSupplier Project (index.html):")
    print("URL:", sup_url)
    print("KEY:", sup_key[:10] + "...")
except Exception as e:
    print("Supplier index.html error:", e)
