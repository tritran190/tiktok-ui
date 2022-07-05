import classNames from 'classnames/bind';
import styles from './AccountItem.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function AccountItem() {
    return (
        <div className={cx('wrapper')}>
            <img
                className={cx('avatar')}
                src="https://p77-sign-va.tiktokcdn.com/musically-maliva-obj/1655538426021894~c5_300x300.webp?x-expires=1657184400&x-signature=nHknqd9LHp6Q0VBI%2Fcy8iYFNbuA%3D"
                alt="CR7"
            />
            <div className={cx('info')}>
                <h4 className={cx('name')}>
                    <span>Tran Duc Tri</span>
                    <FontAwesomeIcon className={cx('checked')} icon={faCheckCircle} />
                </h4>
                <p className={cx('username')}>tritran</p>
            </div>
        </div>
    );
}

export default AccountItem;
