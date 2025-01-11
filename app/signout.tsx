import LoadingScreen from '@c/Loading';
import { signOutRequest } from '@s/authReducer';
import { withUser } from '@u/hocs/withUser';
import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

const SignoutScreen = () => {
  const dispatch = useDispatch();
  const signoutTriggered = useRef(false);
  useEffect(() => {
    if (signoutTriggered.current) return;

    setTimeout(() => {
      dispatch(signOutRequest());
    }, 100);
    signoutTriggered.current = true;
  })
  return (
    <LoadingScreen visible />
  )
}

export default withUser(SignoutScreen);