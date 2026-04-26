import { defineStore } from "pinia";
import { ref } from "vue";

export type LoginPageState =
	| "loading"
	| "setup"
	| "login"
	| "creating-passkey"
	| "authenticating"
	| "error";

export const useLoginStore = defineStore("login", () => {
	const pageState = ref<LoginPageState>("loading");
	const errorMessage = ref<string | null>(null);
	const password = ref("");
	const passkeyOptions = ref<PublicKeyCredentialCreationOptionsJSON | null>(null);

	function setState(state: LoginPageState) {
		pageState.value = state;
		if (state !== "error") errorMessage.value = null;
	}

	function setError(message: string) {
		pageState.value = "error";
		errorMessage.value = message;
	}

	function setPasskeyOptions(options: PublicKeyCredentialCreationOptionsJSON) {
		passkeyOptions.value = options;
	}

	function reset() {
		pageState.value = "loading";
		errorMessage.value = null;
		password.value = "";
		passkeyOptions.value = null;
	}

	return { pageState, errorMessage, password, passkeyOptions, setState, setError, setPasskeyOptions, reset };
});
