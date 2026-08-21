import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add input file and button in imMultiAddView
old_buttons = "'<div style=\"padding:15px\"><button class=\"tbtn\" onclick=\"imMultiAddMoreRows()\">+ Thêm 5 dòng</button></div>'"
new_buttons = "'<div style=\"padding:15px\"><button class=\"tbtn\" onclick=\"imMultiAddMoreRows()\">+ Thêm 5 dòng</button><button class=\"tbtn\" style=\"margin-left:12px; color:#2b6cb0\" onclick=\"document.getElementById(\\'multiAddImgInput\\').click()\"><span id=\"multiAddImgCount\">📸 Tải ảnh đính kèm</span></button><input type=\"file\" id=\"multiAddImgInput\" accept=\"image/*\" multiple style=\"display:none\" onchange=\"imMultiAddUploadImages(event)\"></div>'"
if old_buttons in html:
    html = html.replace(old_buttons, new_buttons)

# 2. Add the imMultiAddUploadImages function before imMultiAddCommit
insert_idx = html.find("async function imMultiAddCommit()")

upload_code = '''
    window.MULTI_ADD_IMAGES = window.MULTI_ADD_IMAGES || new Map();
    
    async function imMultiAddUploadImages(e) {
        var files = e.target.files;
        if (!files || files.length === 0) return;
        
        var btnText = document.getElementById('multiAddImgCount');
        if (btnText) btnText.innerHTML = 'Đang tải (0/' + files.length + ')...';
        
        try {
            await sb.auth.getSession();
            let successCount = 0;
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                let name = file.name;
                let lastDot = name.lastIndexOf('.');
                if (lastDot > 0) name = name.substring(0, lastDot);
                name = name.trim().toUpperCase();
                
                if (btnText) btnText.innerHTML = 'Đang tải (' + (i+1) + '/' + files.length + ')...';
                
                const ext = file.name.split('.').pop();
                const filePath = `${name}-${Date.now()}.${ext}`;
                
                const { error } = await sb.storage.from('item_images').upload(filePath, file);
                if (!error) {
                    const { data: { publicUrl } } = sb.storage.from('item_images').getPublicUrl(filePath);
                    window.MULTI_ADD_IMAGES.set(name, publicUrl);
                    successCount++;
                }
            }
            if (btnText) btnText.innerHTML = '📸 Đã tải ' + window.MULTI_ADD_IMAGES.size + ' ảnh';
        } catch(err) {
            alert("Lỗi tải ảnh: " + err.message);
            if (btnText) btnText.innerHTML = '📸 Tải ảnh đính kèm';
        }
        e.target.value = ''; // reset
    }
'''

if insert_idx != -1:
    html = html[:insert_idx] + upload_code + html[insert_idx:]

# 3. Modify imMultiAddCommit to use window.MULTI_ADD_IMAGES
old_push = "image_url: null"
new_push = "image_url: (window.MULTI_ADD_IMAGES && window.MULTI_ADD_IMAGES.has(itemNo.toUpperCase())) ? window.MULTI_ADD_IMAGES.get(itemNo.toUpperCase()) : null"

# We must be careful to only replace inside imMultiAddCommit
commit_idx = html.find("async function imMultiAddCommit()")
end_commit_idx = html.find("window.MULTI_ADD_IMAGES", commit_idx + len("async function imMultiAddCommit()")) # Or just replace it since it's the only one we just added? Wait, I added upload_code BEFORE imMultiAddCommit.
# The image_url: null inside imMultiAddCommit is unique enough for that function.
if commit_idx != -1:
    sub = html[commit_idx:commit_idx+3000]
    sub = sub.replace("image_url: null", new_push)
    html = html[:commit_idx] + sub + html[commit_idx+3000:]
    
    # Also, clear MULTI_ADD_IMAGES when we successfully switch to draft view or load the view
    # Inside imMultiAddOpen()
    old_open = "st.itemtab = 'multi_add';"
    new_open = "st.itemtab = 'multi_add';\n        window.MULTI_ADD_IMAGES = new Map();"
    html = html.replace(old_open, new_open)

with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Added multi-add image upload successfully")
