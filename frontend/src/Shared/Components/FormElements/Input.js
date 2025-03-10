import React, {useReducer, useEffect} from 'react';

import { validate } from '../../util/validators';
import './Input.css';

const inputReducer = (state, action) => { // the funciton will be passed when using the hook [useReducer]. it takes the current state and the action will be done on this state 
  switch (action.type) {
    case 'CHANGE':
      return {
        ...state,
        value: action.val,
        isValid: validate(action.val, action.validators)
      };
    case 'TOUCH': {
      return {
        ...state,
        isTouched: true
      }
    }
    default:
      return state;
  }
};

const Input = props => {
  const [inputState, dispatch] = useReducer(inputReducer, { // the difference between the hook [useReducer] and [useState] is that [useReducer] can handle complex state(doing complex operations on the state) and it accepts two arguments the function to handle the state and the second argument is optional for the initial state and the hook [useReducer] returns an array of two values, the curent state and the dispatch method for handling this state
    value: props.initialValue || "",
    isValid: props.initialValid || false
  });

  const { id, onInput } = props;
  const { value, isValid } = inputState;

  useEffect(() => {
    onInput(id, value, isValid)
  }, [id, value, isValid, onInput]);


  const changeHandler = event => {
    dispatch({ type: 'CHANGE', val: event.target.value, validators: props.validators }); // passing the [action] object of the two keys [type and val] to the dispatch method for setting [inputState] 
  };

  const touchHandler = () => {
    dispatch({
      type: 'TOUCH'
    });
  };

  const element =
    props.element === 'input' ? (
      <input
        id={props.id}
        type={props.type}
        placeholder={props.placeholder}
        onChange={changeHandler}
        onBlur={touchHandler} // the attribute [onBlur] -> is triggered when the user losses the focus on the input element 
        value={inputState.value} />
    ) : (
      <textarea id={props.id} rows={props.rows || 3} onChange={changeHandler} onBlur={touchHandler} value={inputState.value} />
    );

  return (
    <div className={`form-control ${!inputState.isValid && inputState.isTouched &&'form-control--invalid'}`}>
      <label htmlFor={props.id}>{props.label}</label>
      {element}
      {!inputState.isValid && inputState.isTouched && <p>{props.errorText}</p>}
    </div>
  ); // the attribute [htmlFor] in JSX is like [for] in HTML
};

export default Input;
