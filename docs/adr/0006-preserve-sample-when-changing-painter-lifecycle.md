# Preserve the sample when changing painter lifecycle

Changing an active painter between one-shot and sticky changes only its lifecycle and retains its captured format sample. Resampling is an explicit copy action, which keeps lifecycle controls from silently changing the format that will be applied.
