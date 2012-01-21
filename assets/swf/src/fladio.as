package 
{
    import flash.display.*;
    import flash.external.ExternalInterface;
    import flash.media.*;
    import flash.net.*;
    import flash.system.Security;

    public class fladio extends Sprite
    {
        private var channel:SoundChannel;
        private var streamURL:String;
        private var context:SoundLoaderContext;
        private var sound:Sound;
        private var vol:Number = 1;
        private var played:Boolean = false;

        public function fladio()
        {
            Security.allowDomain("*");
			
            streamURL = this.loaderInfo.parameters["stream"];
            var _vol:String = this.loaderInfo.parameters["volume"];
            var _nop:String = this.loaderInfo.parameters["noplay"];
			
            context = new SoundLoaderContext();
            context.checkPolicyFile = true;
			
            if (streamURL == null) {
                streamURL = "http://frod.io:8000/station20";
            }
                if (_vol != null) {
                    vol = new Number(_vol);
                }
                if (_nop != "true") {
                    connectStream();
                }
			
                try {
                    ExternalInterface.addCallback("play1", connectStream);
                    ExternalInterface.addCallback("stop1", closeStream);
                    ExternalInterface.addCallback("setvolume", setVolume);
                    ExternalInterface.addCallback("setstream", setStream);						
                } catch (error:SecurityError) {}			
			
            return;
        }// end function
		
        public function connectStream() : void
        {
			if (!played) {
				sound = new Sound();
				sound.load(new URLRequest(streamURL), context);
				channel = sound.play();
				setVolume(vol);
				played = true;				
			}
            return;
        }// end function

        public function closeStream() : void
        {
			if (played) {
				sound.close();
				channel.stop();
				sound = null;
				played = false;				
			}
            return;
        }// end function

        public function setVolume(param1:Number) : void
        {
            this.vol = param1;
            var _loc_2:* = channel.soundTransform;
            _loc_2.volume = this.vol;
            channel.soundTransform = _loc_2;
            return;
        }// end function
		
        public function setStream(param1:String) : void
        {
                if (streamURL != param1) {
                        streamURL = param1;
                        if (played) {
                                closeStream();
                                connectStream();
                        }
                }
                return;
        }// end function

    }
}
