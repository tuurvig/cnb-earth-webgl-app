from PIL import Image
import os.path
import glob
import json


IMAGE_WIDTH = 8192
IMAGE_HEIGHT = 4096


def GetDataFromJSON(filepath):
    f = open(filepath, encoding="utf8")
    data = json.loads(' '.join(f.read().split()))
    f.close()
    return data


def WriteDataToJSONFile(data, filepath):
    with open(filepath, 'w', encoding='utf8') as json_file:
        json.dump(data, json_file, ensure_ascii=False)


def SetIndexInCountryGroup(image, index):
    r, g, b, a = image.split()
    r = r.point(lambda i: i + index)
    return Image.merge('RGBA', (r, g, b, a))

def main():
    data = ["app/data/institutions/" + file + ".json" for file in GetDataFromJSON("app/data/group_config.json") ]
    outJSON = []
    wpercent = 0.5
    basewidth = int(float(IMAGE_WIDTH) * wpercent)
    hsize = int(float(IMAGE_HEIGHT) * wpercent)
    
    for filepath in data:
        inst = GetDataFromJSON(filepath)
        outJSON.append(inst)
        instShort = inst["shortcut"]
        instName = inst["lang"]["en"]["name"] + " (" + instShort + ")"
        countries = inst["members"]

        newImageName = "img/groups/" + instShort + ".png"
        
        if os.path.isfile(newImageName):
            print("Group " + instName + " already has a texture!")
            print("To regenerate the texture, delete it and run the script again.")
            continue

        print("Creating group " + instName)    
        group = Image.new('RGBA', (IMAGE_WIDTH, IMAGE_HEIGHT), (0,0,0,0))
        
        groupIx = 0

        for country in countries:
            imgPath = "img/countries/" + country + ".png"
            groupIx += 1

            if not os.path.isfile(imgPath):
                print("Country code " + country + " not found! Ignoring.")
                continue

            print("Merging with " + country)    
            img = Image.open(imgPath)
            img = SetIndexInCountryGroup(img, groupIx)
            group.paste(img, mask=img)
        
        print("Group " + instName + " was successfully created!")
        group = group.resize((basewidth, hsize), Image.ANTIALIAS)
        group.save(newImageName)

    WriteDataToJSONFile(outJSON, "../Content/groups.json")
    print("All group were successfully written into the file groups.json")    
            

if __name__ == '__main__':
    main()