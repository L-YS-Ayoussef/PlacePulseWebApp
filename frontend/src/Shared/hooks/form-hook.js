import { useCallback, useReducer } from 'react';

const formReducer = (state, action) => {
  // console.log(action)
  switch (action.type) {
    case 'INPUT_CHANGE':
      let formIsValid = true;
      for (const inputId in state.inputs) {
        if (!state.inputs[inputId]){
          continue;
        }
        if (inputId === action.inputId) {
          // console.log(inputId)
          formIsValid = formIsValid && action.isValid;
        } else {
          formIsValid = formIsValid && state.inputs[inputId].isValid;
        }
      }
      return {
        ...state,
        inputs: {
          ...state.inputs,
          [action.inputId]: { value: action.value, isValid: action.isValid }
        },
        isValid: formIsValid
      };
    case 'SET_DATA':
      return {
        inputs: action.inputs,
        isValid: action.formIsValid
      };
    default:
      return state;
  }
};

export const useForm = (initialInputs, initialFormValidity) => {
  const [formState, dispatch] = useReducer(formReducer, {
    inputs: initialInputs,
    isValid: initialFormValidity
  });

  // In React, the useCallback hook is used to memoize functions, preventing unnecessary re-renders in functional components. When you use useCallback, React will memoize the provided function and return a memoized version of it.This memoized version will only change if one of the dependencies in the dependency array changes.If the dependencies don't change, React will return the same memoized function instance on subsequent renders, which can be beneficial for performance.
  const inputHandler = useCallback((id, value, isValid) => {
    dispatch({
      type: 'INPUT_CHANGE',
      value: value,
      isValid: isValid,
      inputId: id
    });
  }, []);

  const setFormData = useCallback((inputData, formValidity) => {
    dispatch({
      type: 'SET_DATA',
      inputs: inputData,
      formIsValid: formValidity
    });
  }, []);

  return [formState, inputHandler, setFormData];
};

// Notes --> 
// if not using the hook [useCallback] with the methods [inputHandler] and [setFormData], it will cause an infinite rendering of the page that in the case of the method [inputHandler], when rendering the page [UpdatePlace] the function [inputHandler] will be called and passing the parameters [id, value and the isValid] from the hook [useEffect] inside the component [Input], then the [dispatch] method will executed cause state change, then the page wil be rendered, so the hook [useCallBack] will return the memorized version of the function, then the dispatch method won't be called, then there will no an infinite render of the page
// the hook [useCallback] has no dependecies meaning that there will be only a memorized version/instance of the method, no need for creating a new instance when calling the method, it is only an instance which called onInput in the input fields
// you can use the useEffect hook multiple times within a single component. Each useEffect hook operates independently, and their effects are executed in the order they are defined. This allows you to organize different side effects logically within your component
// 
// The scenario when start typing in the input is that when entering a letter, the onChange handler will be triggered checking input validation and then changing the state(value, isValid) cause the dispatch method, then the page will be rendered, then the inputHandler method will be triggered check the validation of the entire form and through this process -> looping on the [state.inputs] which are [email, password, name(is undefined)], still typing till the form is valid, then in this expression [ formIsValid = formIsValid && state.inputs[inputId].isValid; ] -> cause the formIsValid is true, the second condition [ state.inputs[inputId].isValid; ] will be checked and here in case the [inputId] is [name](which is undefined) -> will give an error, so it is handeled by ->
    // if (!state.inputs[inputId]){
    //   continue;
    // }