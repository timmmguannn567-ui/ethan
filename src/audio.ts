import { birthdayConfig as config } from './config';
/** Original ambient score: slow celestial pads and bell arpeggios, synthesized locally. */
class BirthdayAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private echo?: DelayNode;
  private timer?: number;
  private next = 0;
  private note = 0;
  private enabled = config.music.enabled;
  private chords = [[48,55,60,64,71],[45,52,57,60,67],[41,48,53,57,64],[43,50,55,59,67]];
  async start(): Promise<boolean> {
    if (!this.enabled || document.hidden) return false;
    try {
      this.context ??= new AudioContext();
      const ctx=this.context;
      if (!this.master) {
        this.master=ctx.createGain();this.master.gain.value=0;
        const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=3600;
        const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-18;limiter.ratio.value=4;
        this.master.connect(filter);filter.connect(limiter);limiter.connect(ctx.destination);
        this.echo=ctx.createDelay(2);this.echo.delayTime.value=.72;
        const feedback=ctx.createGain();feedback.gain.value=.28;
        this.echo.connect(feedback);feedback.connect(this.echo);this.echo.connect(this.master);
      }
      await ctx.resume();
      if(!this.enabled || document.hidden) return false;
      this.master.gain.setTargetAtTime(config.music.volume,ctx.currentTime,1.2);
      if(this.timer===undefined){this.next=ctx.currentTime+.1;this.schedule();this.timer=window.setInterval(()=>this.schedule(),180);}
      return ctx.state==='running';
    } catch { return false; }
  }
  private tone(note:number,when:number,duration:number,volume:number,pad=false) {
    const ctx=this.context;if(!ctx||!this.master)return;
    const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=440*2**((note-69)/12);
    gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(volume,when+(pad?1.6:.025));gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
    osc.connect(gain);gain.connect(this.master);if(!pad&&this.echo)gain.connect(this.echo);
    osc.start(when);osc.stop(when+duration+.1);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  private schedule() {
    if(!this.context||document.hidden)return;
    while(this.next<this.context.currentTime+.4){
      const chord=this.chords[Math.floor(this.note/8)%4];
      if(this.note%8===0)for(const n of chord)this.tone(n,this.next,9,.065,true);
      const sequence=[2,4,3,1,4,2,3,4];this.tone(chord[sequence[this.note%8]]+12,this.next,3.7,.095);
      this.note++;this.next+=.9;
    }
  }
  async setEnabled(value:boolean) {
    this.enabled=value;
    if(value)return this.start();
    if(this.context&&this.master)this.master.gain.setTargetAtTime(0,this.context.currentTime,.16);
    clearInterval(this.timer);this.timer=undefined;return false;
  }
  visibility(){if(document.hidden){clearInterval(this.timer);this.timer=undefined;void this.context?.suspend();}else if(this.context&&this.enabled)void this.start();}
  dispose(){clearInterval(this.timer);this.timer=undefined;void this.context?.close();this.context=undefined;this.master=undefined;this.echo=undefined;}
}
export const birthdayAudio=new BirthdayAudio();
