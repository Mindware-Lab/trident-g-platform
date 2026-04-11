Emotion face stimuli for the emotion n-back live here.

Processed pack:
- `afraid/afraid_1.png` to `afraid/afraid_8.png`
- `angry/angry_1.png` to `angry/angry_8.png`
- `happy/happy_1.png` to `happy/happy_8.png`
- `sad/sad_1.png` to `sad/sad_8.png`

Normalization:
- all generated face tiles are `256x256` PNGs
- each tile is rendered on a centered black disk
- everything outside the disk is transparent (`alpha = 0`)
- source uploads are retained at the folder root for reference and reprocessing

Source files currently used:
- `anger 1-8.png`
- `happy 1-8.png`
- `sad 1-8.png`
- `fear 1.png` to `fear 8.png`

Rendering helpers:
- `tools/process-emotion-faces.ps1` builds the normalized source face tiles
- `tools/render-emotion-face-disks.ps1` converts the normalized tiles into the final black-disk stimuli
