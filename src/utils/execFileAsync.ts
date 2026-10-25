import { promisify } from "util";
import { execFile } from "child_process";

const execFileAsync = promisify(execFile);
export default execFileAsync;