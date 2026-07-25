import zipfile, pathlib
base = pathlib.Path(r"c:\Users\HP\Downloads")
out = pathlib.Path(r"c:\Users\HP\OneDrive\A321\Pragyan\tmp_engine_attach")
out.mkdir(parents=True, exist_ok=True)
for zname in ["Phase 1  User Discovery.zip","Phase 2  Interest Engine.zip","Phase 3  Capability Engine.zip"]:
    p = base / zname
    with zipfile.ZipFile(p, 'r') as z:
        for name in z.namelist():
            if name.endswith('/'):
                continue
            data = z.read(name)
            dest = out / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
print('extracted to', out)
