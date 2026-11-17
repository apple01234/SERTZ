"""Read selected IL2CPP v31 declarations; never execute or extract APK members."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import zipfile
import xml.etree.ElementTree as ET


def inspect(apk):
    with zipfile.ZipFile(apk) as archive:
        metadata = archive.read("assets/bin/Data/Managed/Metadata/global-metadata.dat")
        link = ET.fromstring(archive.read("assets/aa/AddressablesLink/link.xml"))
    header = struct.unpack_from("<64I", metadata)
    if header[:2] != (0xFAB11BAF, 31):
        raise ValueError("Only the inspected IL2CPP metadata version 31 is supported")

    def table(pair, size):
        offset, length = header[2 + pair * 2:4 + pair * 2]
        if length % size or offset + length > len(metadata):
            raise ValueError(f"Invalid table {pair}")
        return offset, length // size

    heap_offset, heap_size = header[6:8]
    heap = metadata[heap_offset:heap_offset + heap_size]

    def string(index):
        if not 0 <= index < len(heap) or (index and heap[index - 1] != 0):
            raise ValueError(f"Invalid string index {index}")
        end = heap.index(b"\0", index)
        return heap[index:end].decode("utf-8")

    type_offset, type_count = table(19, 88)
    method_offset, method_count = table(5, 36)
    field_offset, field_count = table(11, 12)
    property_offset, property_count = table(4, 20)
    parameter_offset, parameter_count = table(10, 12)
    image_offset, image_count = table(20, 40)
    images = [struct.unpack_from("<3iIiIiIiI", metadata, image_offset + i * 40) for i in range(image_count)]
    image, = [i for i in images if string(i[0]) == "Assembly-CSharp.dll"]
    linked = {
        t.attrib["fullname"] for a in link if a.attrib.get("fullname", "").startswith("Assembly-CSharp,")
        for t in a if "fullname" in t.attrib
    }
    selected = {
        "PlayerEntity", "PlayerSequenceHandler", "RandomizedPlayerSequenceHandler",
        "AffixCore", "AffixConfig", "BiElemConfig", "AffixesAndUpgradesBySchool",
        "EnemySkillData", "EnemySkillsHandler", "PlayerCharacterSkillCooldownUiHandler",
        "AffixSlotUiHandler", "BiElemSlotUiHandler", "RunBonusAffixSlotUpgradeController",
        "EventActionType", "RewardSchool",
    }
    records = []
    for index in range(image[2], image[2] + image[3]):
        row = struct.unpack_from("<16i8H2I", metadata, type_offset + index * 88)
        name, namespace = string(row[0]), string(row[1])
        if name not in selected:
            continue
        assert row[-1] >> 24 == 0x02
        assert 0 <= row[8] <= row[8] + row[18] <= field_count
        if row[16]:
            assert 0 <= row[9] <= row[9] + row[16] <= method_count
        if row[17]:
            assert 0 <= row[11] <= row[11] + row[17] <= property_count
        fields, methods, properties = [], [], []
        for i in range(row[8], row[8] + row[18]):
            offset = field_offset + i * 12
            field = struct.unpack_from("<2iI", metadata, offset)
            assert field[2] >> 24 == 0x04
            fields.append({"name": string(field[0]), "token": hex(field[2]), "offset": offset})
        for i in range(row[9], row[9] + row[16]):
            offset = method_offset + i * 36
            method = struct.unpack_from("<6iI4H", metadata, offset)
            assert method[1] == index and method[6] >> 24 == 0x06
            method_name = string(method[0])
            if method_name.startswith(("get_", "set_", "<")) or method_name == ".ctor":
                continue
            parameters = []
            if method[10]:
                assert 0 <= method[4] <= method[4] + method[10] <= parameter_count
                for j in range(method[4], method[4] + method[10]):
                    parameter = struct.unpack_from("<iIi", metadata, parameter_offset + j * 12)
                    parameters.append(string(parameter[0]))
            methods.append({"name": method_name, "parameters": parameters, "token": hex(method[6]), "offset": offset})
        for i in range(row[11], row[11] + row[17]):
            offset = property_offset + i * 20
            prop = struct.unpack_from("<3i2I", metadata, offset)
            assert prop[4] >> 24 == 0x17
            properties.append({"name": string(prop[0]), "token": hex(prop[4]), "offset": offset})
        full_name = f"{namespace}.{name}" if namespace else name
        records.append({
            "id": f"EW-TYPE-{index}", "name": full_name, "type_index": index,
            "offset": type_offset + index * 88, "token": hex(row[-1]),
            "kind": "enum" if row[-2] & 2 else "type",
            "also_in_addressables_link_xml": full_name in linked,
            "fields": fields, "properties": properties, "methods": methods,
        })
    assert {r["name"].split(".")[-1] for r in records} == selected
    classifications = []
    for symbol in ["BufferActionIfRelevant", "_timeToBufferAction", "RefreshCharacterSkillCooldownAndCharges",
                   "SetSkillRemainingCooldown", "AffixSchool", "AffixesAndUpgradesBySchool", "BiElemSynergy"]:
        matches = []
        for record in records:
            if record["name"].split(".")[-1] == symbol:
                matches.append({"kind": "type", "owner": record["name"], "offset": record["offset"], "evidence": record["id"]})
            for category in ["fields", "properties", "methods"]:
                for declaration in record[category]:
                    if declaration["name"] == symbol:
                        kind = "enum member" if category == "fields" and record["kind"] == "enum" else {"fields": "field", "properties": "property", "methods": "method"}[category]
                        matches.append({"kind": kind, "owner": record["name"], "offset": declaration["offset"], "evidence": record["id"]})
        assert len(matches) == 1, (symbol, matches)
        classifications.append({"symbol": symbol, **matches[0]})
    with apk.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    return {
        "artifact": {"name": apk.name, "sha256": digest, "size_bytes": apk.stat().st_size},
        "method": "Python stdlib ZIP and IL2CPP v31 metadata declaration parsing; no REA engine, native code, method bodies or gameplay executed",
        "metadata_sha256": hashlib.sha256(metadata).hexdigest(),
        "tables": {"types": type_count, "methods": method_count, "fields": field_count, "properties": property_count, "images": image_count},
        "scope": {"assembly": "Assembly-CSharp.dll", "type_start": image[2], "type_count": image[3]},
        "validation": "Table bounds, exact string boundaries, selected type/method/field tokens, method ownership and parameter ranges asserted",
        "types": records,
        "seed_symbol_classifications": classifications,
        "limits": ["Declarations prove ownership and names, not method execution or call order.",
                   "Field runtime types and serialized values are not resolved.",
                   "No original executable, art, audio or method implementation included."],
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("apk", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    result = inspect(args.apk)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(f"Validated {len(result['types'])} selected types in {result['scope']['assembly']}")
