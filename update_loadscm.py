import re

html_path = 'public/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Define the new loadScmIntoIMD function
new_function = """    async function loadScmIntoIMD() {
        try {
            const { data: rawData, error } = await sb.from('raw_data').select('*, items!inner(description, category), vendor(name)');
            if (error) throw error;
            if (!rawData) return;
            
            if (window.IMD && window.IMD.subItems) {
                // Remove old SCM items
                window.IMD.subItems = window.IMD.subItems.filter(item => !item['_is_scm']);
                if (window.IMD.offers) window.IMD.offers = window.IMD.offers.filter(o => !o['_is_scm']);
                if (window.IMD.items) window.IMD.items = window.IMD.items.filter(i => !i['_is_scm']);
                
                const mappedSubs = rawData.map(r => ({
                    'Item Code': r.item_no,
                    'Sub Item Code': r.item_no + '-' + r.vendor_code,
                    'Sub Item Name': r.sub_desc || r.items.description,
                    'Brand': r.brand || '',
                    'Purchase UOM': r.purch_unit,
                    'Conversion': r.conversion,
                    'Base UOM': r.base_unit,
                    'Shelf Life Days': r.hsd,
                    'Storage': r.storage,
                    'Status': 'Active',
                    '_is_scm': true,
                    'Vendor Name': r.vendor?.name || r.vendor_code
                }));
                
                window.IMD.subItems = window.IMD.subItems.concat(mappedSubs);
                
                const mappedOffers = rawData.map(r => ({
                    'Offer ID': 'OFFER-SCM-' + r.vendor_code + '-' + r.item_no,
                    'Sub Item Code': r.item_no + '-' + r.vendor_code,
                    'Vendor Code': r.vendor_code,
                    'Vendor Name': r.vendor?.name || r.vendor_code,
                    'Location Code': r.loc_code,
                    'Purchase UOM': r.purch_unit,
                    'Conversion': r.conversion,
                    'Base UOM': r.base_unit,
                    'MOQ': r.moq,
                    '_is_scm': true
                }));
                if (!window.IMD.offers) window.IMD.offers = [];
                window.IMD.offers = window.IMD.offers.concat(mappedOffers);
                
                // Add unique items to IMD.items
                const itemSet = new Set();
                const uniqueItems = [];
                rawData.forEach(r => {
                    if (!itemSet.has(r.item_no)) {
                        itemSet.add(r.item_no);
                        uniqueItems.push({
                            'Item Code': r.item_no,
                            'Item Name / Functional Spec': r.items?.description || r.item_no,
                            'Category Code': r.items?.category || 'Cinemunch',
                            'Domain': 'F&B',
                            'Allocation': 'FIFO',
                            'Functional UOM': r.base_unit || 'cái',
                            '_is_scm': true
                        });
                    }
                });
                
                // Filter out any that already exist in static data just in case
                const existingItemCodes = new Set(window.IMD.items.map(i => i['Item Code']));
                const newItemsToAdd = uniqueItems.filter(i => !existingItemCodes.has(i['Item Code']));
                window.IMD.items = window.IMD.items.concat(newItemsToAdd);
                
                // Trigger re-render by switching back to the view
                st.itemtab = 'list';
                if (typeof imRender === 'function') {
                    imRender(); 
                }
            }
        } catch (e) {
            console.error("Failed to load SCM data", e);
        }
    }"""

# Use regex to replace the old loadScmIntoIMD
pattern = re.compile(r'async function loadScmIntoIMD\(\) \{.*?\}(?=\s*// --- END SCM IMPORT LOGIC ---)', re.DOTALL)
html = pattern.sub(new_function, html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated loadScmIntoIMD")
