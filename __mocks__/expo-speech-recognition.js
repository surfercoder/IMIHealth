const listeners = {};

const ExpoSpeechRecognitionModule = {
  addListener: (event, fn) => {
    listeners[event] = listeners[event] || [];
    listeners[event].push(fn);
    return {
      remove: () => {
        listeners[event] = (listeners[event] || []).filter((l) => l !== fn);
      },
    };
  },
  emit: (event, payload) => {
    (listeners[event] || []).forEach((fn) => fn(payload));
  },
  start: jest.fn(),
  stop: jest.fn(),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestSpeechRecognizerPermissionsAsync: jest.fn(async () => ({ granted: true })),
};

module.exports = {
  __esModule: true,
  ExpoSpeechRecognitionModule,
  ExpoWebSpeechRecognition: function () {},
  ExpoWebSpeechGrammar: function () {},
  ExpoWebSpeechGrammarList: function () {},
  useSpeechRecognitionEvent: () => {},
  AVAudioSessionCategory: {},
  AVAudioSessionCategoryOptions: {},
  AVAudioSessionMode: {},
  RecognizerIntentExtraLanguageModel: {},
  RecognizerIntentEnableLanguageSwitch: {},
  AudioEncodingAndroid: {},
  TaskHintIOS: {},
  SpeechRecognizerErrorAndroid: {},
};
