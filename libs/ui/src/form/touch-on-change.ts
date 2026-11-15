export const touchOnChange = {
  onChange: ({ fieldApi }: { fieldApi: { handleBlur: () => void } }) => fieldApi.handleBlur(),
};
