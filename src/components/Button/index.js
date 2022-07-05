import classNames from 'classnames/bind';
import styles from './Button.module.scss';

const cx = classNames.bind(styles);

function Button({ to, href, children, onClick }) {
    let Component = 'button';

    const classes = cx('wrapper');
    return (
        <Component className={classes}>
            <span>{children}</span>
        </Component>
    );
}

export default Button;
