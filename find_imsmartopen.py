import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'imSmartOpen()' in line:
            print('Line ' + str(i+1) + ': ' + line.strip().encode('utf-8').decode('cp1252', 'ignore'))
