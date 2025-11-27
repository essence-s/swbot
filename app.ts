import { Connectbaileys } from './lbSbot/GG.js';

import { DW } from './commands/dw/dw.js';
// import { INFO } from './commands/info.js';
import { MEME } from './commands/meme.js';
import { SYT } from './commands/syt/syt.ts';
import { HELP } from './commands/help.js';
import { UPDATEYTDLP } from './commands/updateYtDlp.js';

const superDino = [HELP, DW, MEME, SYT, UPDATEYTDLP];
// connectToWhatsApp(superDino)
let cB = new Connectbaileys(superDino);
cB.initBailey();
