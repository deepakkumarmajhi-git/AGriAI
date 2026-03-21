from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path


SERVER_MAIN = Path(__file__).resolve().parent / "ml-server" / "main.py"

spec = spec_from_file_location("ml_server_main", SERVER_MAIN)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Unable to load ML server app from {SERVER_MAIN}")

module = module_from_spec(spec)
spec.loader.exec_module(module)

app = module.app
