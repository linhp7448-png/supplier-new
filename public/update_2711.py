import re
with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()
    
# 1. Update loadScmIntoIMD to remove deduplication and change subCode to include loc_code
# Find the mapping logic
# Original: const subCode = r.item_no + '-' + r.vendor_code;
html = html.replace(
    '''const subCode = r.item_no + '-' + r.vendor_code;
if (!subSet.has(subCode)) {
subSet.add(subCode);
mappedSubs.push({
'Item Code': r.item_no,
'Sub Item Code': subCode,''',
    '''const subCode = r.item_no + '-' + r.vendor_code + '-' + (r.loc_code || '');
mappedSubs.push({
'Item Code': r.item_no,
'Sub Item Code': subCode,
'Location Code': r.loc_code || '',
'''
)
# Note: I completely removed the `if (!subSet.has(subCode))` so it maps all rows.
# But wait, there is a closing brace for the `if` that needs to be removed.
html = re.sub(r'\'Image Status\': \(r\.items \&\& r\.items\.image_url\) \? \'Available\' : \'Missing\'\n\}\);\n\}\n\}\);',
              r'\'Image Status\': (r.items && r.items.image_url) ? \'Available\' : \'Missing\'\n});\n});', html)

# 2. Update mappedOffers to use the same Sub Item Code so it links correctly
html = html.replace(
    '''\'Sub Item Code\': r.item_no + '-' + r.vendor_code,''',
    '''\'Sub Item Code\': r.item_no + '-' + r.vendor_code + '-' + (r.loc_code || ''),'''
)

# 3. Update imEditSelected
# Split sid into 3 parts
html = html.replace(
    '''var itemNo = sid.split('-')[0];
            var vendorCode = sid.split('-')[1];''',
    '''var itemNo = sid.split('-')[0];
            var vendorCode = sid.split('-')[1];
            var locCode = sid.split('-').slice(2).join('-');'''
)

# Add Location Code to the UI form
old_label = '<div style="grid-column:1/3"><label style="display:block;font-size:11px;font-weight:bold;color:#2b6cb0;margin-bottom:4px">Item Name (Core)</label>'
new_label = '<div style="grid-column:1/3; background:#f8fafc; padding:8px; border-radius:4px; margin-bottom:8px; display:flex; align-items:center"><span style="font-size:12px; font-weight:bold; color:#64748b; margin-right:8px">📍 Location:</span><span style="font-size:14px; font-weight:bold; color:#0f172a">${esc(row[\'Location Code\'] || \'\')}</span></div>\n                    <div style="grid-column:1/3"><label style="display:block;font-size:11px;font-weight:bold;color:#2b6cb0;margin-bottom:4px">Item Name (Core)</label>'
html = html.replace(old_label, new_label)

# row logic map update
old_row = '''row = {
                    'Category Code': it['Category Code'] || '', 'Item Code': sub['Item Code'], 'Item Name': it['Item Name / Functional Spec'] || '',
                    'Sub Item Code': sub['Sub Item Code'], 'Sub Item Name': sub['Sub Item Name'] || '',
                    'Brand': sub['Brand'] || '', 'Purchase UOM': sub['Purchase UOM'] || '',
                    'Conversion': sub['Conversion'] || '', 'Base UOM': sub['Base UOM'] || '',
                    'Shelf Life': sub['Shelf Life Days'] || '', 'Storage': sub['Storage'] || '',
                    'Vendor Code': of['Vendor Code'] || '', 'Purchase Price': of['Unit Price Excl VAT'] || '',
                    'MOQ': of['MOQ'] || '', 'MOV': of['MOV'] || '', 'Ship If': of['Ship If'] || ''
                };'''
new_row = '''row = {
                    'Category Code': it['Category Code'] || '', 'Item Code': sub['Item Code'], 'Item Name': it['Item Name / Functional Spec'] || '',
                    'Sub Item Code': sub['Sub Item Code'], 'Sub Item Name': sub['Sub Item Name'] || '',
                    'Brand': sub['Brand'] || '', 'Purchase UOM': sub['Purchase UOM'] || '',
                    'Conversion': sub['Conversion'] || '', 'Base UOM': sub['Base UOM'] || '',
                    'Shelf Life': sub['Shelf Life Days'] || '', 'Storage': sub['Storage'] || '',
                    'Vendor Code': of['Vendor Code'] || '', 'Purchase Price': of['Unit Price Excl VAT'] || '',
                    'MOQ': of['MOQ'] || '', 'MOV': of['MOV'] || '', 'Ship If': of['Ship If'] || '', 'Location Code': of['Location Code'] || sub['Location Code'] || ''
                };'''
html = html.replace(old_row, new_row)

# Update Supabase raw_data save
html = html.replace(
    '''.eq('item_no', itemNo).eq('vendor_code', vendorCode);''',
    '''.eq('item_no', itemNo).eq('vendor_code', vendorCode).eq('loc_code', locCode);'''
)

with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Updated 2711 rows')
