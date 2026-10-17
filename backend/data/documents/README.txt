Put your university knowledge-base .txt files in this folder
(e.g. AIUB_ADMISSION_REQUIREMENTS.txt, AIUB_TUTION_FEES.txt, etc.).

After adding or changing any .txt file here, rebuild the index:

    cd backend
    python scripts/rebuild_index.py

This placeholder file will also be picked up by the loader as a
document unless you delete it - remove it once you've added your
real knowledge-base files.
