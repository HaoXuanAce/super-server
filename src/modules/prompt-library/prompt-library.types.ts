export interface PromptLibraryOption {
	id: string
	name: string
}

export interface PromptLibraryOptions {
	filters: PromptLibraryOption[]
	tools: PromptLibraryOption[]
	hotImages: PromptLibraryOption[]
}
