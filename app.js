import { Connectbaileys } from './lbSbot/GG.js';

import { DW } from './commands/dw/dw.js';
import { INFO } from './commands/info.js';
import { MEME } from './commands/meme.js';
import { SYT } from './commands/syt.js';

const superDino = [INFO, DW, MEME, SYT];
// connectToWhatsApp(superDino)
let cB = new Connectbaileys(superDino);
cB.initBailey();
