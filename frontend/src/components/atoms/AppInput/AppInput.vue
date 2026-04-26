<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
	modelValue: string;
	label?: string;
	type?: "text" | "password" | "email";
	placeholder?: string;
	error?: string;
	disabled?: boolean;
}>();

const emit = defineEmits<{
	"update:modelValue": [value: string];
}>();

const showPassword = ref(false);

const inputType = () => {
	if (props.type === "password")
		return showPassword.value ? "text" : "password";
	return props.type ?? "text";
};
</script>

<template>
	<div class="app-input">
		<label v-if="label" class="app-input__label">{{ label }}</label>
		<div class="app-input__wrapper" :class="{ 'app-input__wrapper--error': error, 'app-input__wrapper--disabled': disabled }">
			<input
				:type="inputType()"
				:value="modelValue"
				:placeholder="placeholder"
				:disabled="disabled"
				class="app-input__field"
				@input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
			/>
			<button
				v-if="type === 'password'"
				type="button"
				class="app-input__toggle"
				:aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
				@click="showPassword = !showPassword"
			>
				<svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
					<circle cx="12" cy="12" r="3"/>
				</svg>
				<svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
					<line x1="1" y1="1" x2="23" y2="23"/>
				</svg>
			</button>
		</div>
		<p v-if="error" class="app-input__error" role="alert">{{ error }}</p>
	</div>
</template>

<style scoped>
.app-input {
	display: flex;
	flex-direction: column;
	gap: 6px;
	width: 100%;
}

.app-input__label {
	font-family: var(--font-display);
	font-size: 0.75rem;
	font-weight: 500;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	color: var(--color-text-secondary);
}

.app-input__wrapper {
	position: relative;
	display: flex;
	align-items: center;
	background: var(--color-bg-primary);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.app-input__wrapper:focus-within {
	border-color: var(--color-emerald);
	box-shadow: 0 0 0 3px var(--color-emerald-dim), var(--shadow-neon-emerald);
}

.app-input__wrapper--error {
	border-color: var(--color-error);
}

.app-input__wrapper--error:focus-within {
	border-color: var(--color-error);
	box-shadow: 0 0 0 3px var(--color-error-dim);
}

.app-input__wrapper--disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.app-input__field {
	flex: 1;
	padding: 10px 14px;
	background: transparent;
	border: none;
	outline: none;
	font-family: var(--font-body);
	font-size: 0.95rem;
	color: var(--color-text-primary);
	width: 100%;
}

.app-input__field::placeholder {
	color: var(--color-text-muted);
}

.app-input__toggle {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 12px;
	background: transparent;
	border: none;
	cursor: pointer;
	color: var(--color-text-secondary);
	transition: color var(--transition-fast);
}

.app-input__toggle:hover {
	color: var(--color-text-primary);
}

.app-input__error {
	font-size: 0.8rem;
	color: var(--color-error);
	margin: 0;
}
</style>
