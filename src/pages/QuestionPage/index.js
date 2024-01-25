import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import getElapsedTime from '../../utils/getElapsedTime';
import QuestionPageContainer from './style';

const API_BASE_URL = 'https://openmind-api.vercel.app/3-5';

// TODO 임시 ID. useParams로 동적인 경로 만들어주기.
const USER_ID = 2805;

const getUser = async () => {
  const response = await fetch(`${API_BASE_URL}/subjects/${USER_ID}/`);
  if (!response.ok) {
    throw new Error('유저 데이터를 불러오는데 실패했습니다');
  }
  return response.json();
};

const ReactionButtonBox = ({ question }) => {
  return (
    <div className="reaction-button-box">
      <div className="like-button-box on">
        <figure className="tumbs-up-image" />
        <span className="like">좋아요</span>
        <span className="like-count">{question.like}</span>
      </div>
      <div className="dislike-button-box">
        <figure className="tumbs-down-image" />
        <span className="dislike">싫어요</span>
        <span className="dislike-count">{question.dislike}</span>
      </div>
    </div>
  );
};

const QuestionItem = ({ user, question }) => {
  return (
    <section className="question-answer-box answer-complete">
      {question.answer ? (
        <div className="answer complete">답변 완료</div>
      ) : (
        <div className="answer none">미답변</div>
      )}
      <div className="question-box">
        <div className="question-title-box">
          <span className="question-title">질문 · </span>
          <span className="question-time-line">
            {getElapsedTime(question.createdAt)}
          </span>
        </div>
        <span className="question-content">{question.content}</span>
      </div>

      {question.answer ? (
        <div className="answer-box">
          <img
            src={user.imageSource}
            className="answer-profile-image"
            alt="프로필 이미지"
          />
          <div className="answer-content-box">
            <div className="answer-title-box">
              <span className="answer-profile-name">{user.name}</span>
              <span className="answer-time-line">
                {getElapsedTime(question.answer.createdAt)}
              </span>
            </div>
            {question.answer.isRejected ? (
              <span className="answer-content refuse">답변 거절</span>
            ) : (
              <span className="answer-content">{question.answer.content}</span>
            )}
          </div>
        </div>
      ) : null}
      <ReactionButtonBox question={question} />
    </section>
  );
};

const ProfileShareIcons = () => {
  return (
    <div className="profile-share-icons">
      <div className="profile-share-link-box brown">
        <img
          src="/assets/images/Link.svg"
          className="profile-share-link-logo"
          alt="링크 공유하기 기능이 있는 로고"
        />
      </div>
      <div className="profile-share-link-box yellow">
        <img
          src="/assets/images/Kakaotalk.svg"
          className="profile-share-link-logo Kakaotalk-logo"
          alt="카카오톡으로 공유하기 기능이 있는 카카오톡 로고"
        />
      </div>
      <div className="profile-share-link-box blue">
        <img
          src="/assets/images/Facebook.svg"
          className="profile-share-link-logo Facebook-logo"
          alt="페이스북으로 공유하기 기능이 있는 페이스북 로고"
        />
      </div>
    </div>
  );
};

const QuestionHeader = ({ user }) => {
  return (
    <header className="questions-page-header">
      <section className="header-section">
        <Link to="/">
          <img
            src="/assets/images/logo.png"
            className="logo"
            alt="OpenMind 서비스 로고"
          />
        </Link>
        <section className="profile">
          <img
            src={user.imageSource}
            className="header-profile-image"
            alt="프로필 이미지"
          />
          <span className="profile-name">{user.name}</span>
          <ProfileShareIcons />
        </section>
      </section>
    </header>
  );
};

const QuestionPage = () => {
  const [user, setUser] = useState([]);
  const [questions, setQuestions] = useState([]); // 현재까지 불러온 질문 목록을 저장하는데 사용
  const [hasMore, setHasMore] = useState(true); // 더 불러올 데이터가 있는지 여부를 나타냄
  const [page, setPage] = useState(0); // 현재까지 불러온 페이지 수

  const elementRef = useRef(null); // Intersection Observer에서 관찰 대상으로 사용될 엘리먼트

  const getUserQuestions = async () => {
    const response = await fetch(
      // limit:한번에 4개의 데이터를 가져오고, offset:(page*4)개의 데이터를 넘기고 데이터를 가져옴
      `${API_BASE_URL}/subjects/${USER_ID}/questions/?limit=4&offset=${page * 4}`,
    );
    const responseQuestions = await response.json();
    if (responseQuestions.results.length === 0) {
      setHasMore(false);
    } else {
      setQuestions(prevQuestions => [
        ...prevQuestions,
        ...responseQuestions.results, // 기존 질문 목록에 새로운 데이터가 추가된 새로운 배열
      ]);
      setPage(prevPage => prevPage + 1); // 페이지 수 증가
    }
  };
  const onInterSection = entries => {
    const firstEntry = entries[0];
    if (firstEntry.isIntersecting && hasMore) {
      // .isIntersecting': 해당 엘리먼트가 화면에 보이는지 여부를 나타내는 속성
      getUserQuestions(); // 특정 엘리먼트가 화면에 나타나면서 더 많은 데이터를 가져올 수 있는 상황인지 검사
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(onInterSection); // IntersectionObserver 생성,()안에는 관찰 대상의 상태가 변경될 때 호출되는 콜백함수
    if (observer && elementRef.current) {
      // observer가 존재하고 현재 참조하고 있는 엘리먼트가 존재하면
      observer.observe(elementRef.current); // 관찰 대상 등록, ()안에는 관찰 대상이 되는 HTML 요소
    }
    return () => {
      if (observer) {
        observer.disconnect(); // 모든 관찰을 중지하고 observer 해제
      }
    }; // useEffect의 cleanup 함수. 컴포넘트가 언마운트되거나 업데이트될 때 이전에 등록한 IntersectionObserver를 해제한다. 이를 통해 불필요한 리소스 소모를 방지하고 메모리 누수를 방지한다.
  }, [questions]); // questions가 변경될 때마다 호출
  const fetchData = async () => {
    const responseUser = await getUser();
    setUser(responseUser);
  };
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <QuestionPageContainer>
      <QuestionHeader user={user} />

      <main className="questions-page-main">
        <article className="question-list-container">
          <div className="title-box">
            <figure className="title-image" />
            <span className="title">
              {user.questionCount}개의 질문이 있습니다
            </span>
          </div>
          {/* 질문이 없는 경우 no-question-image 활성화
          <figure className="no-question-image" /> */}

          <div className="question-list">
            {questions.map(question => (
              <QuestionItem key={question.id} user={user} question={question} />
            ))}
            {hasMore && <div ref={elementRef}>Load More Questins...</div>}
          </div>
        </article>
      </main>

      <button className="question-write-button" type="button">
        질문 작성하기
      </button>
      <button className="question-write-button-mobile" type="button">
        질문 작성
      </button>
    </QuestionPageContainer>
  );
};

export default QuestionPage;
