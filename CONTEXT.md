# Format Painter

This context defines the user-facing vocabulary and behavior boundaries for the headless ProseKit format painter extension.

## Language

**Format sample**:
The captured set of formatting characteristics that a user applies to another selection.
_Avoid_: Style, formatting payload

**Inline format**:
Formatting carried by text, such as marks and text style, that does not change document structure.
_Avoid_: Block format, document format

**Common inline format**:
The inline format shared by every part of a non-empty source selection; it is the inline format captured from a mixed selection.
_Avoid_: Start format, anchor format

**Block format**:
Formatting carried by textblocks or wrappers, such as headings, alignment, quotes, and lists, that can change document structure.
_Avoid_: Inline format

**Single-block source selection**:
A source selection whose entire range is within one textblock; only this kind of selection can contribute block format to a format sample.
_Avoid_: Cross-block source selection

**Cross-block source selection**:
A source selection spanning more than one textblock; it contributes common inline format only.
_Avoid_: Multi-block format sample

**Safe inline mode**:
The default format painter behavior, which copies inline format only and leaves block format unchanged.
_Avoid_: Full format painter, default block mode

**Protected mark**:
A mark retained on the target and omitted from a format sample. `link` is the only protected mark built into safe inline mode; applications declare any schema-specific protected marks explicitly.
_Avoid_: Unmanaged mark, copied mark

**Block preset**:
An explicit opt-in configuration that allows the format painter to copy selected block format in addition to inline format.
_Avoid_: Default format painter

**Default format painter options**:
The exported configuration preset for safe inline mode.
_Avoid_: Implicit defaults, inline preset

**Block format painter options**:
The exported configuration preset for copying common block format, including headings, alignment, quotes, and lists.
_Avoid_: Full schema preset

**Supported block preset schema**:
The ProseKit Basic schema, optionally extended with text alignment, whose common node and attribute names are used by block format painter options.
_Avoid_: Generic ProseMirror schema

**Successful application**:
An application attempt in which at least one sampled format is applied to the target.
_Avoid_: Attempted application, unsupported application

**Painter lifecycle**:
Whether an active format painter is one-shot or sticky; changing it never changes the captured format sample.
_Avoid_: Sample mode, format mode

**Unsupported style reason**:
A stable category explaining why a sampled format cannot be applied to a target.
_Avoid_: Error message, arbitrary failure string

**Application target**:
The document range to which a format sample is applied; each target can succeed or report unsupported styles independently.
_Avoid_: Whole selection, failed selection
