import os 

os.chdir(os.path.dirname(os.path.abspath(__file__)))

texture_dir = "LandTexturesSummer"

files = os.listdir(texture_dir)

# print(files)

def check_(offset1, offset2):
    for i in range(16):
        for j in range(16):
            filename = f"land_39_{i+offset1}_{j+offset2}.png.dds"
            if filename not in files:
                return False
    return True

# for o1 in range(-64, 64):
#     for o2 in range(-64, 64):
#         if check_(o1, o2):
#             print(o1, o2)
#             break

selected = []
for i in range(-2,18):
    for j in range(-2,18):
        filename = f"land_39_{i-58}_{j-24}.png.dds"
        selected.append(filename)

for f in files:
    if f not in selected:
        os.remove(os.path.join(texture_dir, f))
        print(f"removed {f}")
