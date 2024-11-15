import { OnlineInputState, KeyNames } from "../Configs/KeyBound";

export class InputSerializer {
    static serialize(inputState: OnlineInputState): string {
        let s = "";
        for (let key of KeyNames) {
            s += inputState[key] ? "1" : "0";
        }
        return s;
    }

    static deserialize(serializedInputState: string): OnlineInputState {
        const inputState: OnlineInputState = {} as OnlineInputState;
        for (let i = 0; i < KeyNames.length; i++) {
            inputState[KeyNames[i]] = serializedInputState[i] === "1";
        }
        return inputState;
    }

    static createEmptyInputState(): OnlineInputState {
        const state: OnlineInputState = {} as OnlineInputState;
        KeyNames.forEach((keyName) => {
            state[keyName] = false;
        });
        return state;
    }
}