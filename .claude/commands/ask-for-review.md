# Ask for Plan review from another model

Ask another coding agent for review - for either your code or your plan (whatever is more relevant in the context of the current conversation)

In order to review, please use the following bash command: cursor-agent <model> --output-format text -p <prompt>

Available models are: gpt5, opus, sonnet

Always use gpt5 unless specified otherwise.

Some additional requests/comments from the user: "$ARGUMENTS" (if empty then it means no requests)