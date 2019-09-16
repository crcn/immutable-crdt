import Pubnub from "pubnub";
import {fork} from "redux-saga/effects";
import {eventChannel} from "redux-saga";

export function* mainSaga() {
  yield fork(pubnub);
}

function* pubnub() {
  const pubnub = new Pubnub({
    publishKey: "pub-c-bbe3e1c2-e863-4519-a975-f09b2b02ce7b",
    subscribeKey: "sub-c-b2812ae4-d6cd-11e9-b2f2-9a66d3fcadaa"
  });

  const chan = eventChannel(function(emit) {

    pubnub.hereNow({}, (status, response) => {
      console.log(response);
    });

    pubnub.addListener({
      message({message}) {
        
      },
      presence() {

      }
    });

    return () => {

    }
  });


  pubnub.subscribe({
    channels: ["app"]
  });

  pubnub.publish({ message: "a", channel: "app" })
}