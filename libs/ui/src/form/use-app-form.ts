import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./form-context";
import {
  CheckboxField,
  NumberField,
  SelectField,
  SliderField,
  TextField,
  TextareaField,
  ToggleField,
} from "./fields";

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    NumberField,
    TextareaField,
    SelectField,
    ToggleField,
    SliderField,
    CheckboxField,
  },
  formComponents: {},
  fieldContext,
  formContext,
});
